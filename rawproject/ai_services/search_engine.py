import os
import json
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Globals for the search engine
tfidf_vectorizer = None
tfidf_matrix = None
documents = []
is_initialized = False

def initialize_search_engine():
    global tfidf_vectorizer, tfidf_matrix, documents, is_initialized

    if is_initialized:
        return

    try:
        print("Initializing Lightweight Legal Search Engine (TF-IDF)...")
        
        # 1. Load documents
        with open(os.path.join(BASE_DIR, "documents.json"), "r", encoding="utf-8") as f:
            documents = json.load(f)

        # 2. Build TF-IDF Index using Law Name, Section, and Title
        # This provides excellent keyword matching for legal queries
        texts = [f"{d['law']} {d['section']} {d['title']}" for d in documents]
        
        tfidf_vectorizer = TfidfVectorizer(
            stop_words='english',
            ngram_range=(1, 2) # Support for phrases like "civil code"
        )
        tfidf_matrix = tfidf_vectorizer.fit_transform(texts)
        
        is_initialized = True
        print("Lightweight Search Engine Ready (Low Memory Mode)")
    except Exception as e:
        print(f"Error during initialization: {e}")

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
    except:
        return None

def search_legal_documents(query, top_k=3):
    if not is_initialized:
        return ("Legal Assistant is starting up...", 0)

    # Greeting handler
    greetings = ["hi", "hello", "hey", "namaste", "how are you"]
    if query.lower().strip() in greetings:
        return ("Namaste! I am your AI Legal Assistant. How can I help you with Nepali laws today?", 100)

    try:
        # Transform query and calculate similarity
        query_tfidf = tfidf_vectorizer.transform([query])
        similarities = cosine_similarity(query_tfidf, tfidf_matrix).flatten()
        
        # Get top results
        top_indices = similarities.argsort()[-top_k:][::-1]
        
        results = []
        scores = []

        for idx in top_indices:
            score = float(similarities[idx])
            if score < 0.05: # Threshold for keyword relevance
                continue
                
            doc = documents[idx].copy()
            full_text = _get_content_info(doc["law"], doc["section"])
            
            if full_text:
                doc["full_text"] = full_text
                results.append(doc)
                scores.append(score)

        if not results:
            return ("I couldn't find any specific legal sections matching your query. Please try using specific legal terms or section numbers.", 0)

        response = "Based on the Nepali legal documents, here are the relevant sections:\n\n"
        for doc in results:
            response += f"#### {doc['law']} - {doc['section']}\n"
            response += f"{doc['full_text']}\n\n"
            response += "---\n\n"

        # TF-IDF scores are usually lower than semantic, so we scale it for the UI
        display_confidence = min(max(scores) * 200, 100) if scores else 0
        return (response, display_confidence)
        
    except Exception as e:
        print(f"Search error: {e}")
        return ("An error occurred during search. Please try again.", 0)