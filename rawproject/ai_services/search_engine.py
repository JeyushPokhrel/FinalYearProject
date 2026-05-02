import os
import json
import numpy as np
import time

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

model = None
doc_embeddings = None
documents = []
is_initialized = False

def initialize_search_engine():
    global model, doc_embeddings, documents, is_initialized

    if is_initialized:
        return

    try:
        print(f"[{time.ctime()}] Starting initialization...")
        
        # Optimization: Limit torch threads to save memory and CPU on Render
        try:
            import torch
            torch.set_num_threads(1)
            print(f"[{time.ctime()}] Torch threads limited to 1")
        except ImportError:
            pass

        from sentence_transformers import SentenceTransformer

        print(f"[{time.ctime()}] Loading SentenceTransformer model (all-MiniLM-L6-v2)...")
        # Use CPU explicitly to avoid any CUDA overhead if present
        model = SentenceTransformer('all-MiniLM-L6-v2', device='cpu')

        print(f"[{time.ctime()}] Loading embeddings from npy...")
        doc_embeddings = np.load(os.path.join(BASE_DIR, "embeddings.npy"))

        print(f"[{time.ctime()}] Loading documents from json...")
        with open(os.path.join(BASE_DIR, "documents.json"), "r", encoding="utf-8") as f:
            documents = json.load(f)

        is_initialized = True
        print(f"[{time.ctime()}] Search engine ready")
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
        print(f"Error loading content for {law} {section}: {e}")
        return None

def search_legal_documents(query, top_k=3):
    if not is_initialized:
        return ("The legal assistant is still warming up. This usually takes 1-2 minutes after deployment. Please try again in a moment.", 0)

    greetings = ["hi", "hello", "hey", "namaste", "how are you"]
    if query.lower().strip() in greetings:
        return ("Namaste! I am your AI Legal Assistant. I can help you find information about the Constitution, Civil Code, Criminal Code, and other Nepali laws. What would you like to know?", 100)

    try:
        query_embedding = model.encode([query])

        from sklearn.metrics.pairwise import cosine_similarity
        similarities = cosine_similarity(query_embedding, doc_embeddings).flatten()

        top_indices = similarities.argsort()[-top_k:][::-1]

        results = []
        scores = []

        for idx in top_indices:
            score = float(similarities[idx])
            if score < 0.2:
                continue

            doc = documents[idx].copy()
            full_text = _get_content_info(doc["law"], doc["section"])
            
            if full_text and len(full_text.strip()) > 10:
                doc["full_text"] = full_text
                results.append(doc)
                scores.append(score)

        if not results:
            for idx in top_indices[:1]:
                score = float(similarities[idx])
                if score > 0.15:
                    doc = documents[idx]
                    results.append({
                        "law": doc["law"],
                        "section": doc["section"],
                        "full_text": doc["title"]
                    })
                    scores.append(score)

        if not results:
            return ("I'm sorry, I couldn't find any relevant legal provisions for your query. Could you please rephrase or be more specific?", 0)

        response = "I found the following relevant legal provisions:\n\n"
        for doc in results:
            response += f"#### {doc['law']} - {doc['section']}\n"
            response += f"{doc['full_text']}\n\n"
            response += "---\n\n"

        return (response, max(scores) * 100)
    except Exception as e:
        print(f"Error during search: {e}")
        return ("An error occurred while searching. Please try again.", 0)