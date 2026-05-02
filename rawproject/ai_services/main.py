from fastapi import FastAPI
from pydantic import BaseModel
import threading

from search_engine import initialize_search_engine, search_legal_documents

app = FastAPI()

class ChatRequest(BaseModel):
    message: str

@app.on_event("startup")
def startup_event():
    print("Initializing search engine...")
    threading.Thread(target=initialize_search_engine).start()

@app.get("/")
def root():
    return {"message": "AI Legal Assistant Running"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/chat")
def chat(req: ChatRequest):
    reply, confidence = search_legal_documents(req.message)
    return {
        "reply": reply,
        "confidence": confidence
    }