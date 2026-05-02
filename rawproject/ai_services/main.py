from fastapi import FastAPI, Request
from pydantic import BaseModel
import os
import traceback

from search_engine import initialize_search_engine, search_legal_documents

app = FastAPI(title="AI Legal Assistant API (Debug Mode)")

class ChatRequest(BaseModel):
    message: str

@app.on_event("startup")
def startup_event():
    try:
        initialize_search_engine()
    except Exception as e:
        print(f"Startup Error: {e}")

@app.get("/")
def root():
    return {"message": "AI Legal Assistant Ready"}

@app.get("/health")
def health():
    from search_engine import is_initialized
    return {
        "status": "ok", 
        "ready": is_initialized, 
        "mode": "Lightweight",
        "working_dir": os.getcwd()
    }

@app.post("/chat")
async def chat(req: ChatRequest):
    try:
        reply, confidence = search_legal_documents(req.message)
        return {
            "reply": reply,
            "confidence": confidence
        }
    except Exception as e:
        # Return the actual error so we can debug it
        error_details = traceback.format_exc()
        print(f"Chat Error: {error_details}")
        return {
            "reply": f"AI Internal Error: {str(e)}",
            "confidence": 0,
            "debug": error_details
        }