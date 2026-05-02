import os
import json
import numpy as np
from sentence_transformers import SentenceTransformer

DATA_FOLDER = "data"

texts = []
documents = []

for filename in os.listdir(DATA_FOLDER):
    if filename.endswith(".json"):
        with open(os.path.join(DATA_FOLDER, filename), encoding="utf-8") as f:
            data = json.load(f)

            for section, sec_data in data.items():
                text = f"{sec_data.get('title','')} {sec_data.get('content','')}"
                
                if not text.strip():
                    continue

                texts.append(text)
                documents.append({
                    "law": filename.replace(".json", ""),
                    "section": section,
                    "title": sec_data.get("title", "")
                })

print("Loading model...")
model = SentenceTransformer('all-MiniLM-L6-v2')

print("Encoding...")
embeddings = model.encode(texts).astype("float16")

np.save("embeddings.npy", embeddings)

with open("documents.json", "w", encoding="utf-8") as f:
    json.dump(documents, f, ensure_ascii=False)

print("✅ Done: embeddings.npy + documents.json created")