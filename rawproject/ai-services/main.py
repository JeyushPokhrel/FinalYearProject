from fastapi import FastAPI
from pydantic import BaseModel
from search import initialize, search

app = FastAPI()

# =========================================
# STARTUP (IMPORTANT)
# =========================================

@app.on_event("startup")
def startup_event():
    initialize()

# =========================================

class ChatRequest(BaseModel):
    message: str

@app.get("/")
def root():
    return {"message": "AI Legal Assistant Running"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/chat")
def chat(req: ChatRequest):
    reply = search(req.message)
    return {"reply": reply, "confidence": 100}