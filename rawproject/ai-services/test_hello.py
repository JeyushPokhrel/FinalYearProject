from search_engine import vectorizer, tfidf_matrix, search_legal_documents, cosine_similarity

query = "hello"
query_vector = vectorizer.transform([query])
similarities = cosine_similarity(query_vector, tfidf_matrix).flatten()
print("Max similarity for 'hello':", similarities.max())
print(search_legal_documents("hello", 3))
