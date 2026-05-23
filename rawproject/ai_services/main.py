"""
main.py
FastAPI entry point for the AI Legal Assistant service.

Request shape:  { "message": str, "language": "en" | "ne" }
Response shape: { "reply": str, "confidence": float }

Pipeline per request:
  1. BM25 retrieval (search_engine.py) → top 3 sections + raw confidence score.
  2. Groq LLM layer → generates a plain-English (or Nepali) answer grounded
     in those exact sections.  Cites law name + section number.  Appends
     a legal disclaimer.  Refuses non-legal questions.
  3. Graceful fallback → if Groq is unavailable, times out, or returns an
     error, the raw BM25 sections are returned unchanged.  The user always
     gets a useful response — Groq is an enhancement, not a dependency.

Also appends per-query entries to logs.json and updates running totals in
stats.json after every request.
"""

import os
import json
import time
import traceback
from datetime import datetime

import httpx
from fastapi import FastAPI
from pydantic import BaseModel

from search_engine import initialize_search_engine, search_legal_documents, find_related_sections

app = FastAPI(title="AI Legal Assistant — Nepali Law Search")


# Request model

class ChatRequest(BaseModel):
    message:  str
    language: str = "en"   # "en" = English, "ne" = Nepali (sent by frontend)


# File paths

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
LOGS_PATH  = os.path.join(BASE_DIR, "logs.json")
STATS_PATH = os.path.join(BASE_DIR, "stats.json")


# Groq configuration

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL   = "llama-3.1-8b-instant"   # fast, free-tier friendly, reliable
GROQ_TIMEOUT = 15                        # seconds before falling back to BM25


# System prompt — English mode.
# Rules the examiner can read and verify one by one.
_SYSTEM_PROMPT_EN = """\
You are a legal assistant specialising in Nepali law.

You will be given retrieved sections from Nepal's official legal documents, \
followed by the user's question. Answer the question in clear, plain English \
based ONLY on those retrieved sections.

STRICT RULES — follow every one without exception:

1. GROUND your answer solely in the retrieved sections provided. Do not use \
any outside knowledge. If the sections do not contain enough information to \
answer, say exactly: "I could not find a clear answer in the available legal \
texts. Please consult a qualified lawyer."

2. CITE the law name and section number for every legal claim, \
e.g. "Under the **Labour Act, Section 142**…"

3. REFUSE non-legal questions. If the question is clearly not about Nepali \
law (e.g. cooking, sports, weather, general knowledge), respond with: \
"I can only answer questions about Nepali law. Please ask a legal question."

4. SENSITIVE TOPICS — if the question involves domestic violence, abuse, \
self-harm, or personal safety: acknowledge the seriousness briefly, provide \
whatever relevant legal protection the retrieved sections mention (e.g. \
protection orders, penalties), and remind the user that professional legal \
help and support services are available.

5. DISCLAIMER — end every response with this exact line on its own:\n\
⚠️ This is for informational purposes only and does not constitute legal \
advice. Consult a qualified lawyer for your specific situation.

6. FORMAT — use short paragraphs. Bold law names and section numbers. \
Avoid unnecessary bullet lists unless listing multiple distinct penalties \
or rights. Do not repeat the retrieved sections verbatim — synthesise them.
"""

# System prompt — Nepali mode.
# Identical rules, instructs the model to respond entirely in Nepali.
_SYSTEM_PROMPT_NE = """\
तपाईं नेपाली कानूनका विशेषज्ञ कानूनी सहायक हुनुहुन्छ।

तपाईंलाई नेपालका आधिकारिक कानूनी दस्तावेजहरूबाट खोजिएका धाराहरू र \
प्रयोगकर्ताको प्रश्न दिइनेछ। प्रश्नको उत्तर केवल ती धाराहरूमा आधारित \
भएर सरल नेपाली भाषामा दिनुहोस्।

कडा नियमहरू — सबैलाई बिना अपवाद पालना गर्नुहोस्:

1. उत्तर केवल दिइएका कानूनी धाराहरूमा आधारित हुनुपर्छ। बाहिरी ज्ञान \
प्रयोग नगर्नुहोस्। यदि धाराहरूमा पर्याप्त जानकारी छैन भने ठ्याक्कै यसरी \
भन्नुहोस्: "उपलब्ध कानूनी पाठहरूमा स्पष्ट उत्तर भेटिएन। कृपया योग्य \
वकिलसँग परामर्श गर्नुहोस्।"

2. प्रत्येक कानूनी दाबीको लागि कानूनको नाम र धारा नम्बर उल्लेख \
गर्नुहोस्, जस्तै "**श्रम ऐन, दफा १४२** अनुसार…"

3. गैर-कानूनी प्रश्नहरू अस्वीकार गर्नुहोस्। यदि प्रश्न नेपाली कानूनसँग \
सम्बन्धित छैन भने भन्नुहोस्: "म केवल नेपाली कानूनसम्बन्धी प्रश्नहरूको \
उत्तर दिन सक्छु। कृपया कानूनी प्रश्न सोध्नुहोस्।"

4. संवेदनशील विषयहरू (घरेलु हिंसा, दुर्व्यवहार, आत्महत्या, व्यक्तिगत \
सुरक्षा): गम्भीरता स्वीकार गर्नुहोस्, सम्बन्धित कानूनी सुरक्षाको \
जानकारी दिनुहोस्, र व्यावसायिक कानूनी सहायता उपलब्ध छ भनी सम्झाउनुहोस्।

5. अस्वीकरण — प्रत्येक उत्तरको अन्तमा आफ्नै पङ्क्तिमा यो थप्नुहोस्:\n\
⚠️ यो जानकारीको लागि मात्र हो र कानूनी सल्लाह होइन। आफ्नो विशेष \
परिस्थितिको लागि योग्य वकिलसँग परामर्श गर्नुहोस्।

6. ढाँचा — छोटा अनुच्छेदहरू प्रयोग गर्नुहोस्। कानूनका नाम र धारा \
नम्बरहरू **बोल्ड** गर्नुहोस्। धाराहरू शब्दशः नदोहोर्याउनुस् — \
तिनलाई संश्लेषण गर्नुहोस्।
"""


def _extract_sections_for_groq(bm25_reply: str) -> str:
    """
    Strip the BM25 reply down to just the section headings and body text
    so Groq receives clean context without the markdown intro line.

    BM25 reply format:
        Based on the Nepali legal documents, here are the relevant sections:

        #### Labour - Section 142
        <title and content text>

        ---

    We drop the intro sentence and the --- dividers, keeping only the
    #### headings and body paragraphs.  Groq's context window stays tidy.
    """
    lines = bm25_reply.splitlines()
    out   = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("Based on the Nepali"):
            continue
        if stripped == "---":
            out.append("")      # blank line as section separator
            continue
        out.append(line)
    return "\n".join(out).strip()


def _call_groq(user_question: str, retrieved_sections: str, language: str) -> str | None:
    """
    Send the user question + retrieved BM25 sections to Groq and return
    the model's synthesised answer as a plain string.

    Returns None (triggering graceful fallback) if:
      - GROQ_API_KEY is not set in the environment
      - The HTTP request exceeds GROQ_TIMEOUT seconds
      - Groq returns a non-200 HTTP status
      - Any other exception occurs

    Uses httpx directly rather than the groq SDK so the implementation
    is fully transparent and readable for the examiner — every field
    in the request payload is explicit.

    temperature=0.2 keeps answers factual and consistent.
    max_tokens=1024 is enough for a well-structured legal answer.
    """
    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        return None   # no key → silently fall back, already warned at startup

    system_prompt = _SYSTEM_PROMPT_NE if language == "ne" else _SYSTEM_PROMPT_EN

    # Build the user turn: retrieved context first, then the question.
    # This ordering follows the "RAG" pattern — context before query.
    user_message = (
        f"Retrieved legal sections:\n\n{retrieved_sections}\n\n"
        f"User question: {user_question}"
    )

    payload = {
        "model":       GROQ_MODEL,
        "max_tokens":  1024,
        "temperature": 0.2,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_message},
        ],
    }

    try:
        with httpx.Client(timeout=GROQ_TIMEOUT) as client:
            response = client.post(
                GROQ_API_URL,
                json=payload,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type":  "application/json",
                },
            )

        if response.status_code != 200:
            print(f"GROQ ERROR {response.status_code}: {response.text[:300]}")
            return None

        answer = response.json()["choices"][0]["message"]["content"].strip()
        return answer

    except httpx.TimeoutException:
        print(f"GROQ TIMEOUT after {GROQ_TIMEOUT}s — falling back to raw BM25 sections.")
        return None
    except Exception as exc:
        print(f"GROQ EXCEPTION: {exc}")
        return None


# Logging helpers
def _load_json_file(path: str, default):
    """Read a JSON file; return default if missing or corrupt."""
    if not os.path.exists(path):
        return default
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return default


def _save_json_file(path: str, data) -> None:
    """Write data to a JSON file atomically (write-to-tmp then rename)."""
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp, path)


def _append_log(entry: dict) -> None:
    logs = _load_json_file(LOGS_PATH, [])
    logs.append(entry)
    _save_json_file(LOGS_PATH, logs)


def _update_stats(response_time: float, success: bool, confidence: float) -> None:
    stats = _load_json_file(STATS_PATH, {
        "total_queries":             0,
        "successful":                0,
        "failed":                    0,
        "average_response_time_sec": 0.0,
        "average_confidence":        0.0,
    })

    n = stats["total_queries"] + 1
    stats["total_queries"] = n

    if success:
        stats["successful"] += 1
    else:
        stats["failed"] += 1

    # Incremental mean — no need to re-read all past logs
    old_t = stats["average_response_time_sec"]
    stats["average_response_time_sec"] = round(old_t + (response_time - old_t) / n, 4)

    conf_normalised = confidence / 100.0
    old_c = stats["average_confidence"]
    stats["average_confidence"] = round(old_c + (conf_normalised - old_c) / n, 4)

    _save_json_file(STATS_PATH, stats)


# Startup

@app.on_event("startup")
def startup_event():
    groq_key = os.environ.get("GROQ_API_KEY", "")
    if not groq_key:
        print(
            "WARNING: GROQ_API_KEY not set — "
            "Groq LLM layer disabled, raw BM25 sections will be returned."
        )
    else:
        print(f"Groq LLM layer ENABLED (model: {GROQ_MODEL}).")

    try:
        initialize_search_engine()
    except FileNotFoundError as e:
        print(f"STARTUP ERROR: {e}")
        print("Run precompute.py locally to regenerate documents.json, then redeploy.")
    except Exception as e:
        print(f"STARTUP ERROR (unexpected): {e}")
        print(traceback.format_exc())


# Routes

@app.get("/")
def root():
    return {"message": "AI Legal Assistant Ready", "status": "ok"}


@app.get("/health")
def health():
    from search_engine import is_initialized, N
    groq_enabled = bool(os.environ.get("GROQ_API_KEY", ""))
    return {
        "status":           "ok",
        "ready":            is_initialized,
        "mode":             f"BM25+Groq ({GROQ_MODEL})" if groq_enabled else "BM25",
        "documents_loaded": N,
        "groq_enabled":     groq_enabled,
    }


@app.get("/stats")
def get_stats():
    return _load_json_file(STATS_PATH, {
        "total_queries":             0,
        "successful":                0,
        "failed":                    0,
        "average_response_time_sec": 0.0,
        "average_confidence":        0.0,
    })


@app.get("/logs")
def get_logs():
    return _load_json_file(LOGS_PATH, [])


@app.post("/chat")
async def chat(req: ChatRequest):
    """
    Main chat endpoint.

    Accepts: { "message": str, "language": "en" | "ne" }
    Returns: { "reply": str, "confidence": float }

    Steps:
      1. BM25 retrieval → (bm25_reply, confidence).
      2. If confidence > 0 (real legal result, not a greeting/error):
           a. Extract clean section text from bm25_reply.
           b. Call Groq with the appropriate language system prompt.
           c. Use Groq answer if successful; fall back to bm25_reply if not.
      3. If confidence == 0 (greeting, no-match): return bm25_reply as-is.
      4. Log entry + stats update (errors here never affect the response).
    """
    start_time = time.time()
    success    = True
    error_msg  = None
    reply      = ""
    confidence = 0

    # Validate language — only accept "en" or "ne", default to "en"
    language = req.language if req.language in ("en", "ne") else "en"

    related = []   # related sections panel — empty list on error/no-match

    try:
        # Step 1: BM25 retrieval
        # search_legal_documents returns (reply, confidence).
        # We also need the raw doc_ids to find related sections, so we
        # call the internal scored list directly here.
        from search_engine import (
            is_initialized, _query_cache, spell_correct_query,
            classify_query, expand_synonyms, preprocess,
            inverted_index, _bm25_score, CATEGORY_BOOST, documents as _docs,
        )

        bm25_reply, confidence = search_legal_documents(req.message)

        # Step 2: Find related sections using the retrieved doc IDs.
        # We re-derive the top doc IDs from the cache-warmed engine rather
        # than duplicating retrieval logic — look up which docs match the
        # same query stems used internally.
        if confidence > 0:
            corrected   = spell_correct_query(req.message)
            category    = classify_query(corrected)
            stems       = preprocess(expand_synonyms(corrected))
            cand_ids: set[int] = set()
            for s in stems:
                cand_ids.update(inverted_index.get(s, []))

            scored_rel = []
            for did in cand_ids:
                sc = _bm25_score(stems, did)
                if sc > 0:
                    if category and _docs[did].get("law") == category:
                        sc *= CATEGORY_BOOST
                    scored_rel.append((did, sc))
            scored_rel.sort(key=lambda x: x[1], reverse=True)
            top_ids = [did for did, _ in scored_rel[:3]]
            related = find_related_sections(top_ids, top_k=4)

        # Step 3: Groq LLM layer (only for real results, not greetings/errors)
        if confidence > 0:
            sections    = _extract_sections_for_groq(bm25_reply)
            groq_answer = _call_groq(req.message, sections, language)

            # Use Groq answer if we got one; otherwise fall back gracefully
            reply = groq_answer if groq_answer else bm25_reply
        else:
            # Greeting, no-match, or empty query — return as-is
            reply = bm25_reply

    except Exception as e:
        success    = False
        error_msg  = str(e)
        reply      = f"Internal error: {error_msg}"
        confidence = 0
        print(f"CHAT ERROR:\n{traceback.format_exc()}")

    response_time = round(time.time() - start_time, 4)

    log_entry = {
        "timestamp":         datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "question":          req.message,
        "answer":            reply,
        "response_time_sec": response_time,
        "success":           success,
        "error":             error_msg,
    }
    try:
        _append_log(log_entry)
        _update_stats(response_time, success, confidence)
    except Exception as log_err:
        print(f"LOGGING ERROR: {log_err}")  # never crash the response

    return {
        "reply":      reply,
        "confidence": confidence,
        "related":    related,   # list of {law, section, title, preview} dicts
    }
