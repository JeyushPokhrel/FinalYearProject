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
    # If on Render, we might want to initialize synchronously so the service 
    # doesn't report 'Live' until the model is actually loaded.
    if os.getenv("RENDER"):
        print(f"[{time.ctime()}] Render environment detected. Initializing search engine...")
        # We still use a thread but we can add a small delay or check
        threading.Thread(target=initialize_search_engine).start()
    else:
        print(f"[{time.ctime()}] Local environment detected. Initializing in background...")
        threading.Thread(target=initialize_search_engine).start()

@app.get("/")
def root():
    return {
        "message": "AI Legal Assistant API is running",
        "environment": "Render" if os.getenv("RENDER") else "Local"
    }

@app.get("/health")
def health():
    from search_engine import is_initialized
    return {
        "status": "ok",
        "ready": is_initialized
    }

@app.post("/chat")
def chat(req: ChatRequest):
    reply, confidence = search_legal_documents(req.message)
    return {
        "reply": reply,
        "confidence": confidence
    }