from fastapi import FastAPI
from pydantic import BaseModel
import threading
import os
import time

from search_engine import initialize_search_engine, search_legal_documents

app = FastAPI(title="AI Legal Assistant API")

class ChatRequest(BaseModel):
    message: str

@app.on_event("startup")
def startup_event():
    print(f"[{time.ctime()}] Starting application...")
    # Always run in thread to prevent blocking the health check
    threading.Thread(target=initialize_search_engine).start()

@app.get("/")
def root():
    return {
        "message": "AI Legal Assistant API is running",
        "environment": "Render" if os.getenv("RENDER") else "Local"
    }

@app.get("/health")
def health():
    import search_engine
    return {
        "status": "ok",
        "ready": search_engine.is_initialized,
        "engine": "TF-IDF (Lightweight)" if search_engine.use_fallback else "Semantic (AI)"
    }

@app.post("/chat")
def chat(req: ChatRequest):
    reply, confidence = search_legal_documents(req.message)
    return {
        "reply": reply,
        "confidence": confidence
    }