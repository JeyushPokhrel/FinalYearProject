from search_engine import vectorizer, tfidf_matrix, search_legal_documents, cosine_similarity

query = "theft punishment"
query_vector = vectorizer.transform([query])
similarities = cosine_similarity(query_vector, tfidf_matrix).flatten()
print("Max similarity:", similarities.max())
