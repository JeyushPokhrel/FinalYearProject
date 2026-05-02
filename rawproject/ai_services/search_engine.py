import os
# FORCE CPU-ONLY MODE BEFORE ANY IMPORTS
os.environ["CUDA_VISIBLE_DEVICES"] = ""
os.environ["TORCH_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"

import json
import numpy as np
import time
import threading

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

model = None
doc_embeddings = None
documents = []
is_initialized = False
use_fallback = False

# TF-IDF Fallback components
tfidf_vectorizer = None
tfidf_matrix = None

def initialize_search_engine():
    global model, doc_embeddings, documents, is_initialized, use_fallback, tfidf_vectorizer, tfidf_matrix

    if is_initialized:
        return

    try:
        print(f"[{time.ctime()}] Starting initialization...")
        
        # 1. Load documents first (very light)
        print(f"[{time.ctime()}] Loading documents...")
        with open(os.path.join(BASE_DIR, "documents.json"), "r", encoding="utf-8") as f:
            documents = json.load(f)

        # 2. Try to initialize Semantic Search (Heavy)
        try:
            from sentence_transformers import SentenceTransformer
            import torch
            
            print(f"[{time.ctime()}] Loading Semantic Model (all-MiniLM-L6-v2)...")
            model = SentenceTransformer('all-MiniLM-L6-v2', device='cpu')
            model.eval() # Set to eval mode to save memory
            
            print(f"[{time.ctime()}] Loading Semantic Embeddings...")
            doc_embeddings = np.load(os.path.join(BASE_DIR, "embeddings.npy"))
            
            is_initialized = True
            print(f"[{time.ctime()}] Semantic Search engine ready")
            
        except Exception as semantic_error:
            print(f"[{time.ctime()}] Semantic Search failed (likely RAM): {semantic_error}")
            print(f"[{time.ctime()}] Switching to Lightweight TF-IDF Fallback...")
            use_fallback = True
            
            from sklearn.feature_extraction.text import TfidfVectorizer
            
            # Use titles and snippets for TF-IDF indexing
            texts = [f"{d['law']} {d['section']} {d['title']}" for d in documents]
            tfidf_vectorizer = TfidfVectorizer(stop_words='english')
            tfidf_matrix = tfidf_vectorizer.fit_transform(texts)
            
            is_initialized = True
            print(f"[{time.ctime()}] TF-IDF Fallback engine ready")

    except Exception as e:
        print(f"[{time.ctime()}] CRITICAL ERROR during initialization: {e}")
        import traceback
        traceback.print_exc()

def _get_content_info(law, section):
    try:
        law_file = law.replace(" ", "_")
        file_path = os.path.join(BASE_DIR, "data", f"{law_file}.json")
        if not os.path.exists(file_path):
            file_path = os.path.join(BASE_DIR, "data", f"{law}.json")

        if not os.path.exists(file_path):
            return None

        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            section_data = data.get(section)
            if not section_data:
                return None
            
            title = section_data.get("title", "").strip()
            content = section_data.get("content", "").strip()
            
            full_text = title
            if content:
                if full_text and not full_text.endswith(('.', ':', '?', '!')):
                    full_text += " " + content
                else:
                    full_text += "\n\n" + content
            
            return full_text
    except Exception as e:
        return None

def search_legal_documents(query, top_k=3):
    if not is_initialized:
        return ("AI Legal Assistant is starting up (loading legal data). Please try again in a minute.", 0)

    greetings = ["hi", "hello", "hey", "namaste", "how are you"]
    if query.lower().strip() in greetings:
        return ("Namaste! I am your AI Legal Assistant. How can I help you with Nepali laws today?", 100)

    try:
        results = []
        scores = []

        if not use_fallback:
            # Semantic Search Path
            query_embedding = model.encode([query])
            from sklearn.metrics.pairwise import cosine_similarity
            similarities = cosine_similarity(query_embedding, doc_embeddings).flatten()
            top_indices = similarities.argsort()[-top_k:][::-1]
            
            for idx in top_indices:
                score = float(similarities[idx])
                if score < 0.15: continue
                doc = documents[idx].copy()
                full_text = _get_content_info(doc["law"], doc["section"])
                if full_text:
                    doc["full_text"] = full_text
                    results.append(doc)
                    scores.append(score)
        else:
            # TF-IDF Fallback Path (Zero RAM overhead)
            from sklearn.metrics.pairwise import cosine_similarity
            query_tfidf = tfidf_vectorizer.transform([query])
            similarities = cosine_similarity(query_tfidf, tfidf_matrix).flatten()
            top_indices = similarities.argsort()[-top_k:][::-1]
            
            for idx in top_indices:
                score = float(similarities[idx])
                if score < 0.05: continue
                doc = documents[idx].copy()
                full_text = _get_content_info(doc["law"], doc["section"])
                if full_text:
                    doc["full_text"] = full_text
                    results.append(doc)
                    scores.append(score)

        if not results:
            return ("I couldn't find any specific legal provisions matching your query. Could you please provide more details?", 0)

        response = "Based on the Nepali legal documents, here are the relevant sections:\n\n"
        for doc in results:
            response += f"#### {doc['law']} - {doc['section']}\n"
            response += f"{doc['full_text']}\n\n"
            response += "---\n\n"

        return (response, max(scores) * 100 if scores else 0)
    except Exception as e:
        print(f"Error during search: {e}")
        return ("I encountered an error while searching. Please try again.", 0)