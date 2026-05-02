from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from search_engine import search_legal_documents

import json
import os
import re

# =========================================
# FASTAPI APP
# =========================================

app = FastAPI()

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
# ROOT ROUTE
# =========================================

@app.get("/")
async def root():
    return {
        "message": "AI Legal Assistant Running"
    }

# =========================================
# LANGUAGE DETECTION
# =========================================

from deep_translator import GoogleTranslator

def is_nepali(text):
    """Check if the text contains Devanagari script characters."""
    return bool(re.search(r'[\u0900-\u097F]', text))

# =========================================
# CHAT ROUTE
# =========================================

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

        # 2. Search legal documents (handles greetings, legal, and off-topic internally)
        result_text, confidence_score = search_legal_documents(search_query)

        # 3. Translate result back to Nepali if user asked in Nepali
        if needs_translation and result_text:
            # GoogleTranslator has a ~5000 character limit, so chunk if needed
            if len(result_text) <= 4900:
                final_reply = GoogleTranslator(source='en', target='ne').translate(result_text)
            else:
                # Translate in chunks
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

# =========================================
# DOCUMENTS ROUTE
# =========================================

@app.get("/documents/{law_name}")
async def get_documents(law_name: str):

    try:
        # path to JSON file
        file_path = f"data/{law_name}.json"

        # check file exists
        if not os.path.exists(file_path):
            return {
                "error": "Law file not found"
            }

        # open json file
        with open(file_path, "r", encoding="utf-8") as file:
            data = json.load(file)

        documents = []

        # loop through sections
        for section_name, section_data in data.items():
            documents.append({
                "section": section_name,
                "title": section_data.get("title", ""),
                "content": section_data.get("content", "")
            })

        return documents

    except Exception as e:
        print(e)
        return {
            "error": str(e)
        }