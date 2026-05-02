from fastapi import FastAPI
from pydantic import BaseModel
import os

from search_engine import initialize_search_engine, search_legal_documents

app = FastAPI(title="AI Legal Assistant API (Lightweight)")

class ChatRequest(BaseModel):
    message: str

@app.on_event("startup")
def startup_event():
    # Initialize TF-IDF (Fast and Low Memory)
    initialize_search_engine()

@app.get("/")
def root():
    return {"message": "Lightweight AI Legal Assistant Running"}

@app.get("/health")
def health():
    from search_engine import is_initialized
    return {"status": "ok", "ready": is_initialized, "mode": "Lightweight"}

@app.post("/chat")
def chat(req: ChatRequest):
    reply, confidence = search_legal_documents(req.message)
    return {
        "reply": reply,
        "confidence": confidence
    }