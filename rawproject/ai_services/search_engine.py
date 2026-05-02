import os
import json
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

model = None
doc_embeddings = None
documents = []

# =========================================
# INITIALIZATION (RUN ONCE)
# =========================================

def initialize():
    global model, doc_embeddings, documents

    print("Loading model + embeddings...")

    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")

    doc_embeddings = np.load(os.path.join(BASE_DIR, "embeddings.npy"))

    with open(os.path.join(BASE_DIR, "documents.json"), "r", encoding="utf-8") as f:
        documents = json.load(f)

    print("✅ READY")

# =========================================
# SEARCH
# =========================================

def search(query, top_k=3):
    query_embedding = model.encode([query])

    from sklearn.metrics.pairwise import cosine_similarity
    similarities = cosine_similarity(query_embedding, doc_embeddings).flatten()

    top_indices = similarities.argsort()[-top_k:][::-1]

    results = []

    for idx in top_indices:
        doc = documents[idx]

        content = load_content(doc["law"], doc["section"])

        results.append({
            "law_name": doc["law_name"],
            "section": doc["section"],
            "title": doc["title"],
            "content": content
        })

    return format_response(results)

# =========================================

def load_content(law, section):
    try:
        file_path = os.path.join(BASE_DIR, "data", f"{law}.json")
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get(section, {}).get("content", "")
    except:
        return ""

# =========================================

def format_response(results):
    response = ""

    for doc in results:
        response += f"### {doc['law_name']}\n"
        response += f"**{doc['section']} - {doc['title']}**\n\n"
        response += f"> {doc['content'][:800]}...\n\n"

    return response