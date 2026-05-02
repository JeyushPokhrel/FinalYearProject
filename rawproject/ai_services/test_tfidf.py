from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

texts = [
    "This is a legal document.",
    "Another legal text about property."
]

vectorizer = TfidfVectorizer(stop_words="english")
tfidf_matrix = vectorizer.fit_transform(texts)

query = "hello"
query_vector = vectorizer.transform([query])
similarities = cosine_similarity(query_vector, tfidf_matrix).flatten()

print("Query:", query)
print("Similarities:", similarities)
