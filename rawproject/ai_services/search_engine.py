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

    doc_path = os.path.join(BASE_DIR, "documents.json")
    if not os.path.exists(doc_path):
        raise FileNotFoundError(f"Missing documents.json")

    with open(doc_path, "r", encoding="utf-8") as f:
        documents = json.load(f)

    print("Indexing full content for high accuracy...")
    
    # ACCURACY BOOST: Index both Title AND Content
    full_texts = []
    for d in documents:
        # Get basic metadata
        meta = f"{d.get('law', '')} {d.get('section', '')} {d.get('title', '')}"
        
        # Try to get actual content for the index
        content = ""
        try:
            law_file = d['law'].replace(" ", "_")
            file_path = os.path.join(BASE_DIR, "data", f"{law_file}.json")
            if os.path.exists(file_path):
                with open(file_path, "r", encoding="utf-8") as f_content:
                    data = json.load(f_content)
                    section_data = data.get(d['section'])
                    if section_data:
                        content = section_data.get("content", "")
        except:
            pass
            
        full_texts.append(f"{meta} {content}".lower())

    tfidf_vectorizer = TfidfVectorizer(
        stop_words='english',
        ngram_range=(1, 2),
        max_features=10000 # Keep it memory efficient
    )
    tfidf_matrix = tfidf_vectorizer.fit_transform(full_texts)
    
    is_initialized = True
    print("Full-Text Search Engine Ready")

def _get_content_info(law, section):
    try:
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
    except:
        return None

def search_legal_documents(query, top_k=3):
    if not is_initialized:
        initialize_search_engine()

    query = query.lower().strip()
    
    # Greetings
    if query in ["hi", "hello", "hey", "namaste"]:
        return ("Namaste! I am your AI Legal Assistant. How can I help you today?", 100)

    # Transform query and calculate similarity
    query_tfidf = tfidf_vectorizer.transform([query])
    similarities = cosine_similarity(query_tfidf, tfidf_matrix).flatten()
    
    top_indices = similarities.argsort()[-top_k:][::-1]
    
    results = []
    scores = []

    for idx in top_indices:
        score = float(similarities[idx])
        if score < 0.01:
            continue
            
        doc = documents[idx].copy()
        full_text = _get_content_info(doc["law"], doc["section"])
        
        if full_text:
            doc["full_text"] = full_text
            results.append(doc)
            scores.append(score)

    if not results:
        return ("I couldn't find any specific legal sections matching your query. Please try searching for specific terms like 'Theft', 'Property', or 'Section 5'.", 0)

    response = "Based on the Nepali legal documents, here are the relevant sections:\n\n"
    for doc in results:
        response += f"#### {doc['law']} - {doc['section']}\n"
        response += f"{doc['full_text']}\n\n"
        response += "---\n\n"

    # Scale score for UI
    display_confidence = min(max(scores) * 250, 100) if scores else 0
    return (response, display_confidence)