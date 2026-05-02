from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager

import search_engine
from deep_translator import GoogleTranslator
import re

# =========================================
# LIFESPAN (Startup/Shutdown)
# =========================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    # This runs on startup
    # We trigger the heavy initialization in the background
    # so that the server can bind to the port immediately
    from threading import Thread
    thread = Thread(target=search_engine.initialize_search_engine)
    thread.start()
    yield
    # Cleanup logic (if any) goes here

# =========================================
# FASTAPI APP
# =========================================

app = FastAPI(lifespan=lifespan)

# =========================================
# CORS
# =========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================
# REQUEST MODEL
# =========================================

class ChatRequest(BaseModel):
    message: str

# =========================================
# ROUTES
# =========================================

@app.get("/")
async def root():
    return {
        "message": "AI Legal Assistant Running",
        "status": "Ready" if search_engine.is_initialized else "Initializing"
    }

@app.get("/health")
async def health():
    if search_engine.is_initialized:
        return {"status": "healthy"}
    else:
        return {"status": "initializing"}

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        question = request.message.strip()
        needs_translation = is_nepali(question)

        # 1. Translate Nepali to English for processing
        if needs_translation:
            search_query = GoogleTranslator(source='ne', target='en').translate(question)
        else:
            search_query = question

        # 2. Search legal documents
        result_text, confidence_score = search_engine.search_legal_documents(search_query)

        # 3. Translate result back to Nepali if user asked in Nepali
        if needs_translation and result_text and search_engine.is_initialized:
            # GoogleTranslator has a ~5000 character limit
            if len(result_text) <= 4900:
                final_reply = GoogleTranslator(source='en', target='ne').translate(result_text)
            else:
                chunks = []
                words = result_text.split('\n\n')
                current_chunk = ""
                for para in words:
                    if len(current_chunk) + len(para) + 2 < 4900:
                        current_chunk += para + "\n\n"
                    else:
                        if current_chunk:
                            chunks.append(current_chunk.strip())
                        current_chunk = para + "\n\n"
                if current_chunk:
                    chunks.append(current_chunk.strip())

                translated_chunks = []
                for chunk in chunks:
                    try:
                        translated = GoogleTranslator(source='en', target='ne').translate(chunk)
                        translated_chunks.append(translated)
                    except:
                        translated_chunks.append(chunk)

                final_reply = "\n\n".join(translated_chunks)
        else:
            final_reply = result_text

        return {
            "reply": final_reply,
            "confidence": confidence_score
        }

    except Exception as e:
        print(f"Chat error: {e}")
        return {
            "reply": "I apologize, but I encountered an error processing your request. Please try again.",
            "confidence": 0.0,
            "error": str(e)
        }

def is_nepali(text):
    """Check if the text contains Devanagari script characters."""
    return bool(re.search(r'[\u0900-\u097F]', text))