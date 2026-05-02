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

    print(f"Initializing Search Engine from: {BASE_DIR}")
    
    doc_path = os.path.join(BASE_DIR, "documents.json")
    if not os.path.exists(doc_path):
        raise FileNotFoundError(f"Missing documents.json at {doc_path}")

    # 1. Load documents
    with open(doc_path, "r", encoding="utf-8") as f:
        documents = json.load(f)

    # 2. Build TF-IDF Index
    texts = []
    for d in documents:
        # Combine everything we know for better matching
        search_text = f"{d.get('law', '')} {d.get('section', '')} {d.get('title', '')}"
        texts.append(search_text)
    
    tfidf_vectorizer = TfidfVectorizer(
        stop_words='english',
        ngram_range=(1, 3) # Up to 3-word phrases for better accuracy
    )
    tfidf_matrix = tfidf_vectorizer.fit_transform(texts)
    
    is_initialized = True
    print("Search Engine Initialized Successfully")

def _get_content_info(law, section):
    try:
        # Try both space and underscore versions
        law_variants = [law, law.replace(" ", "_")]
        
        for variant in law_variants:
            file_path = os.path.join(BASE_DIR, "data", f"{variant}.json")
            if os.path.exists(file_path):
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    section_data = data.get(section)
                    if section_data:
                        title = section_data.get("title", "").strip()
                        content = section_data.get("content", "").strip()
                        return f"{title}\n\n{content}".strip()
        return None
    except Exception as e:
        print(f"Error loading section {section} from {law}: {e}")
        return None

def search_legal_documents(query, top_k=3):
    if not is_initialized:
        initialize_search_engine()

    query = query.lower().strip()
    
    # Simple greeting detection
    if query in ["hi", "hello", "hey", "namaste"]:
        return ("Namaste! I am your AI Legal Assistant. How can I help you today?", 100)

    # Transform query and calculate similarity
    query_tfidf = tfidf_vectorizer.transform([query])
    similarities = cosine_similarity(query_tfidf, tfidf_matrix).flatten()
    
    # Get top results
    top_indices = similarities.argsort()[-top_k:][::-1]
    
    results = []
    scores = []

    for idx in top_indices:
        score = float(similarities[idx])
        if score < 0.01: # Very low threshold to catch more results
            continue
            
        doc = documents[idx].copy()
        full_text = _get_content_info(doc["law"], doc["section"])
        
        if full_text:
            doc["full_text"] = full_text
            results.append(doc)
            scores.append(score)

    if not results:
        return ("I'm sorry, I couldn't find any specific legal matches for that. Could you try rephrasing or using a specific legal term?", 0)

    response = "Based on the Nepali legal documents, here are the relevant sections:\n\n"
    for doc in results:
        response += f"### {doc['law']} - {doc['section']}\n"
        response += f"{doc['full_text']}\n\n"
        response += "---\n\n"

    display_confidence = min(max(scores) * 300, 100) if scores else 0
    return (response, display_confidence)