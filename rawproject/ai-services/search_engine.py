import os
import json
import numpy as np
import gc

# =========================================
# GLOBALS & CONFIG
# =========================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FOLDER = os.path.join(BASE_DIR, "data")

# Global state for lazy initialization
model = None
doc_embeddings = None
documents = []
is_initialized = False

# Friendly law name mapping
LAW_NAMES = {
    "Civil": "Civil Code of Nepal (Muluki Dewani Samhita)",
    "Constitution": "Constitution of Nepal, 2072 (2015)",
    "Criminal1": "National Penal (Code) Act, 2074 (2017)",
    "Criminal2": "Sentencing Act, 2074 (2017)",
    "Criminal3": "Criminal Procedure Code Act, 2074 (2017)",
    "Evidence_Act": "Evidence Act, 2031 (1974)",
}

def initialize_search_engine():
    """
    Initialize the search engine: load documents and encode them.
    Heavy imports are moved inside here to allow the server to start instantly.
    """
    global model, doc_embeddings, documents, is_initialized
    
    if is_initialized:
        return

    try:
        # Move heavy imports inside to prevent blocking the main thread during startup
        from sentence_transformers import SentenceTransformer
        
        print("Starting Search Engine initialization in background...")
        temp_texts = []
        temp_documents = []

        # 1. Load legal JSON files (Metadata only)
        for filename in os.listdir(DATA_FOLDER):
            if filename.endswith(".json"):
                filepath = os.path.join(DATA_FOLDER, filename)
                print(f"Loading {filename} metadata...")

                with open(filepath, "r", encoding="utf-8") as file:
                    data = json.load(file)

                    if isinstance(data, dict):
                        for section_name, section_data in data.items():
                            if not isinstance(section_data, dict):
                                continue

                            title = str(section_data.get("title", "")).strip()
                            content = str(section_data.get("content", "")).strip()
                            full_text = f"{title} {content}".strip()

                            if len(full_text) == 0:
                                continue

                            law_key = filename.replace(".json", "")
                            temp_documents.append({
                                "law": law_key,
                                "law_name": LAW_NAMES.get(law_key, law_key),
                                "section": section_name,
                                "title": title
                            })
                            temp_texts.append(full_text)

        if not temp_texts:
            print("No valid legal text found.")
            return

        # 2. Load Model
        print("Loading sentence transformer model (CPU optimized)...")
        model = SentenceTransformer('all-MiniLM-L6-v2', device='cpu')

        # 3. Encode Documents
        print("Encoding legal documents (reduced batch size)...")
        doc_embeddings = model.encode(temp_texts, show_progress_bar=False, batch_size=16)
        
        # 4. Cleanup to save RAM
        documents = temp_documents
        temp_texts.clear()
        gc.collect()
        
        is_initialized = True
        print(f"Search Engine ready! Documents loaded: {len(documents)}")

    except Exception as e:
        print(f"Initialization error in background thread: {e}")


# =========================================
# INTENT CLASSIFICATION
# =========================================

GREETINGS = [
    "hi", "hello", "hey", "namaste", "hola", "good morning",
    "good afternoon", "good evening", "what's up", "howdy",
    "greetings", "sup", "yo"
]

LEGAL_KEYWORDS = [
    "law", "legal", "section", "act", "court", "crime", "criminal",
    "civil", "constitution", "right", "punishment", "penalty",
    "murder", "theft", "property", "marriage", "divorce", "custody",
    "contract", "evidence", "witness", "judge", "lawyer", "bail",
    "arrest", "sentence", "fine", "imprisonment", "rape", "assault",
    "fraud", "forgery", "defamation", "compensation", "liability",
    "negligence", "inheritance", "citizenship", "fundamental",
    "nepal", "nepali", "government", "parliament", "supreme",
    "district", "appellate", "prosecution", "defendant", "plaintiff",
    "verdict", "appeal", "writ", "habeas corpus", "mandamus",
    "certiorari", "prohibition", "injunction", "land", "tenant",
    "landlord", "labor", "employment", "insurance", "tax",
    "corruption", "bribery", "smuggling", "drug", "trafficking",
    "domestic violence", "child", "minor", "juvenile", "adoption",
    "passport", "immigration", "extradition", "cybercrime",
    "accident", "hurt", "grievous", "robbery", "dacoity",
    "kidnapping", "abduction", "dowry", "alimony", "maintenance",
    "succession", "will", "testament", "power of attorney",
    "notary", "affidavit", "complaint", "fir", "charge sheet",
    "what happens if", "is it illegal", "can i", "what is the law",
    "what are my rights", "how to file", "what is the penalty",
    "what is the punishment", "legal provision", "according to law"
]

def classify_intent(query):
    """Classify user query intent: greeting, legal, or general."""
    q = query.strip().lower()

    # Check greetings
    if q in GREETINGS or any(q.startswith(g) for g in GREETINGS):
        return "greeting"

    # Check if it contains legal keywords
    for keyword in LEGAL_KEYWORDS:
        if keyword in q:
            return "legal"

    return "unknown"


# =========================================
# MAIN SEARCH FUNCTION
# =========================================

def _get_content_on_demand(law_key, section_name):
    """Fetch content from JSON only when needed to save RAM."""
    try:
        filepath = os.path.join(DATA_FOLDER, f"{law_key}.json")
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            section_data = data.get(section_name, {})
            return section_data.get("content", "")
    except Exception as e:
        print(f"Error loading content: {e}")
        return ""


def search_legal_documents(query, top_k=3):
    """
    Search legal documents using semantic similarity.
    Returns a tuple: (response_text, confidence_percentage)
    """
    if not is_initialized:
        return (
            "I am currently initializing my legal database. This usually takes about a minute "
            "during a fresh deployment. Please try your question again in a moment!",
            0.0
        )

    intent = classify_intent(query)

    # Handle greetings
    if intent == "greeting":
        return (
            "Namaste! I am your Legal AI Assistant, specialized in the laws of Nepal. "
            "I have knowledge of the Constitution of Nepal, the National Penal Code, "
            "the Civil Code, the Criminal Procedure Code, the Sentencing Act, and the Evidence Act.\n\n"
            "You can ask me questions like:\n"
            "- \"What is the punishment for theft in Nepal?\"\n"
            "- \"What are my fundamental rights under the Constitution?\"\n"
            "- \"What does the law say about property inheritance?\"\n"
            "- \"What is the bail provision for criminal cases?\"\n\n"
            "How can I assist you today?",
            100.0
        )

    # Encode the query
    query_embedding = model.encode([query])

    # Calculate semantic similarity
    from sklearn.metrics.pairwise import cosine_similarity
    similarities = cosine_similarity(query_embedding, doc_embeddings).flatten()

    # Get top matching indices
    top_indices = similarities.argsort()[-top_k:][::-1]

    results = []
    scores = []

    for idx in top_indices:
        score = float(similarities[idx])

        # Semantic similarity threshold
        if score < 0.25:
            continue
        
        # Load content ON DEMAND for the top matches
        doc_metadata = documents[idx]
        content = _get_content_on_demand(doc_metadata['law'], doc_metadata['section'])
        
        doc_with_content = doc_metadata.copy()
        doc_with_content['content'] = content
        
        results.append(doc_with_content)
        scores.append(score)

    max_score = max(scores) if scores else 0.0
    confidence = round(max_score * 100, 1)

    # If no relevant documents found
    if len(results) == 0:
        if intent == "unknown":
            return (
                "I appreciate your question, but I am specifically designed as a Legal AI Assistant "
                "for Nepal's laws. I can help you with questions about:\n\n"
                "- Constitution of Nepal\n"
                "- National Penal Code (Criminal Law)\n"
                "- Civil Code\n"
                "- Criminal Procedure Code\n"
                "- Sentencing Act\n"
                "- Evidence Act\n\n"
                "Please try asking a legal question related to Nepalese law, "
                "and I'll do my best to help you!",
                0.0
            )
        else:
            return (
                "I searched through Nepal's legal documents but couldn't find a specific provision "
                "that directly addresses your query. This could mean:\n\n"
                "1. The topic may be covered under a different law not in my database.\n"
                "2. Try rephrasing your question with more specific legal terms.\n"
                "3. For complex legal matters, please consult a licensed Nepalese lawyer.\n\n"
                "I have knowledge of the Constitution, Penal Code, Civil Code, Criminal Procedure, "
                "Sentencing Act, and Evidence Act of Nepal.",
                0.0
            )

    # Build a conversational, simple response
    response = _format_response(query, results, scores, confidence)
    return (response, confidence)


def _format_response(query, results, scores, confidence):
    """Format search results into a clean, structured, premium Markdown response."""

    # If only one strong result
    if len(results) == 1:
        doc = results[0]
        response = f"### {doc['law_name']}\n"
        response += f"**{doc['section']}: {doc['title']}**\n\n"
        response += f"> {_simplify_content(doc['content'])}\n\n"
        response += f"---\n"
        response += f"**ℹ️ Legal Note:** This reference is extracted from the *{doc['law_name']}*. "
        response += f"For official legal advice, please consult a certified legal professional in Nepal."
        return response

    # Multiple results
    response = "Based on Nepal's legal documents, here are the most relevant provisions found:\n\n"

    for i, (doc, score) in enumerate(zip(results, scores), 1):
        match_pct = round(score * 100, 1)
        response += f"#### {i}. {doc['law_name']} — {doc['section']}\n"
        response += f"**{doc['title']}**\n\n"
        response += f"> {_simplify_content(doc['content'])}\n\n"
        response += f"*Relevance Match: {match_pct}%*\n\n"

    response += "---\n"
    response += f"**ℹ️ Legal Note:** These references are generated based on semantic search through Nepal's legal texts. "
    response += f"For official legal advice, please consult a certified legal professional."
    return response


def _simplify_content(content):
    """Clean up and structure legal content for high readability."""
    if not content:
        return "*(No content text available for this section)*"
        
    content = content.strip()

    # Add line breaks before sub-section markers like (1), (2), (a), (b)
    # This makes legal lists much more readable
    import re
    
    # Ensure there's a newline before (1), (2) etc if not already there
    content = re.sub(r'(\s+)(\(\d+\))', r'\n\n\2', content)
    # Ensure there's a newline and indentation for (a), (b) etc
    content = re.sub(r'(\s+)(\([a-z]\))', r'\n  \2', content)

    # Trim if excessively long, but keep it substantial
    if len(content) > 1800:
        content = content[:1800] + "...\n\n*(Note: Content truncated for brevity. You can ask for more details on this specific section.)*"

    return content