import os
import json
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

model = None
doc_embeddings = None
documents = []
is_initialized = False

def initialize_search_engine():
    global model, doc_embeddings, documents, is_initialized

    if is_initialized:
        return

    from sentence_transformers import SentenceTransformer

    print("Loading model...")
    model = SentenceTransformer('all-MiniLM-L6-v2')

    print("Loading embeddings...")
    doc_embeddings = np.load(os.path.join(BASE_DIR, "embeddings.npy"))

    print("Loading documents...")
    with open(os.path.join(BASE_DIR, "documents.json"), "r", encoding="utf-8") as f:
        documents = json.load(f)

    is_initialized = True
    print("Search engine ready")

def _get_content_info(law, section):
    try:
        # Normalize law name to filename
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
            
            # Combine title and content if they seem like part of the same sentence
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
        return ("Still initializing, try again...", 0)

    # Simple greeting check
    greetings = ["hi", "hello", "hey", "namaste", "how are you"]
    if query.lower().strip() in greetings:
        return ("Namaste! I am your AI Legal Assistant. I can help you find information about the Constitution, Civil Code, Criminal Code, and other Nepali laws. What would you like to know?", 100)

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
        # Get full text by combining title and content from the JSON data
        full_text = _get_content_info(doc["law"], doc["section"])
        
        if full_text and len(full_text.strip()) > 10: # Avoid very short/broken fragments
            doc["full_text"] = full_text
            results.append(doc)
            scores.append(score)

    if not results:
        # Fallback: if no high-quality content found, try to use the title from documents.json
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