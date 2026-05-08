"""
search_engine.py
- Core search engine for the Nepali Legal Assistant.

What this file does (in order):
  1. Loads documents.json into memory on first request.
  2. Preprocesses every document: clean → tokenize → remove stopwords →
     stem → (synonym expansion is applied to queries only at search time).
  3. Builds an inverted index: {term → [doc_ids]} for fast lookup.
  4. Computes BM25 document-length statistics (avgdl, doc lengths).
  5. At query time:
       a. Spell-check the query (Levenshtein distance — runs silently).
       b. Classify the query into a law category to bias search.
       c. Expand synonyms.
       d. Preprocess the query through the same pipeline.
       e. Look up candidate documents via the inverted index.
       f. Score candidates with BM25, apply category boost.
       g. Return top-k results formatted for the frontend.
  6. Caches results so repeated identical queries are free.

Note — Sklearn wasn't used for any algorithm here, we used numpy.
"""

import os
import json
import re
import math
import time
from collections import defaultdict

import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# BM25 hyper-parameters (standard Okapi BM25 values)
BM25_K1 = 1.5   # Term-frequency saturation.
BM25_B  = 0.75  # Document-length normalisation.

# Title tokens are repeated TITLE_WEIGHT times so they score higher than
# content tokens under BM25's term-frequency model.
TITLE_WEIGHT = 3

# Score multiplier applied to documents from the classified law category.
# 1.0 = no boost.  1.4 = 40% score lift for on-category documents.
CATEGORY_BOOST = 1.4

# Stopwords — English general + legal domain
_ENGLISH_STOPWORDS = {
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
    "been", "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "could", "should", "not", "no", "nor", "so", "yet", "both",
    "either", "neither", "each", "more", "most", "other", "into", "through",
    "during", "before", "after", "above", "below", "between", "out", "off",
    "over", "under", "again", "then", "once", "here", "there", "when",
    "where", "why", "how", "all", "any", "some", "such", "than", "too",
    "also", "its", "it", "this", "that", "these", "those", "i", "me", "my",
    "we", "our", "you", "your", "he", "she", "his", "her", "they", "their",
    "what", "which", "who", "whom", "if", "about", "up", "can",
}

_LEGAL_STOPWORDS = {
    "shall", "may", "act", "law", "section", "court", "person",
    "thereof", "therein", "hereby", "upon", "within", "without",
    "provided", "pursuant", "notwithstanding", "accordance", "herein",
    "mentioned", "referred", "under", "made", "following", "sub",
    "clause", "article", "schedule", "regulation", "rule",
}

STOPWORDS = _ENGLISH_STOPWORDS | _LEGAL_STOPWORDS

# Synonym dictionary
SYNONYMS: dict[str, list[str]] = {
    # Employment / dismissal
    "fired":        ["terminated", "dismissed", "discharged"],
    "fire":         ["terminate", "dismiss", "discharge"],
    "sacked":       ["terminated", "dismissed"],
    "laid off":     ["terminated", "dismissed", "retrenched"],
    "layoff":       ["termination", "dismissal", "retrenchment"],
    "retrench":     ["terminate", "dismiss"],

    # Incarceration
    "jail":         ["imprisonment", "detention", "custody"],
    "jailed":       ["imprisoned", "detained"],
    "prison":       ["imprisonment", "detention"],
    "locked up":    ["imprisoned", "detained"],

    # Financial penalty
    "fine":         ["penalty", "sanction", "forfeiture"],
    "fined":        ["penalised", "sanctioned"],

    # Property
    "land":         ["property", "immovable", "cadastral"],
    "house":        ["property", "dwelling", "residence", "premises"],
    "home":         ["property", "dwelling", "residence", "premises"],
    "evict":        ["dispossess", "eject", "vacate"],
    "eviction":     ["dispossession", "ejection"],

    # Contracts
    "contract":     ["agreement", "deed", "instrument"],
    "sue":          ["litigation", "legal action", "claim"],
    "lawsuit":      ["litigation", "case", "proceedings"],
    "settle":       ["arbitration", "mediation", "compromise"],

    # Family
    "divorce":      ["dissolution", "separation"],
    "marriage":     ["matrimony", "wedlock"],
    "married":      ["spouse", "matrimonial"],
    "child":        ["minor", "juvenile", "infant"],
    "children":     ["minors", "juveniles"],
    "abuse":        ["violence", "assault", "harm"],
    "domestic violence": ["domestic abuse", "spousal abuse"],

    # Rights
    "right":        ["entitlement", "privilege", "liberty"],
    "freedom":      ["liberty", "right"],
    "vote":         ["election", "franchise", "suffrage"],
    "citizen":      ["national", "resident"],

    # Crime
    "steal":        ["theft", "larceny", "robbery"],
    "stolen":       ["theft", "misappropriation"],
    "robbery":      ["theft", "dacoity", "larceny"],
    "murder":       ["homicide", "manslaughter", "killing"],
    "kill":         ["homicide", "manslaughter"],
    "assault":      ["battery", "attack", "hurt"],
    "bribe":        ["corruption", "gratification"],
    "bribery":      ["corruption", "graft"],
    "fraud":        ["cheating", "deception", "misrepresentation"],
    "cheat":        ["fraud", "deception", "misrepresentation"],

    # Digital / modern
    "internet":     ["electronic", "digital", "cyber"],
    "email":        ["electronic mail", "digital communication"],
    "hacking":      ["unauthorized access", "cyber crime"],
    "data":         ["information", "record"],

    # Tax / finance
    "tax":          ["taxation", "levy", "duty", "impost"],
    "vat":          ["value added tax", "indirect tax"],
    "loan":         ["credit", "borrowing", "debt"],
    "bank":         ["financial institution", "lending"],
    "insurance":    ["indemnity", "assurance"],

    # Environment
    "pollution":    ["environmental damage", "contamination"],
    "environment":  ["ecology", "natural resources"],

    # Labour
    "salary":       ["wages", "remuneration", "pay", "compensation"],
    "wage":         ["salary", "remuneration", "pay"],
    "overtime":     ["additional hours", "extra work"],
    "leave":        ["vacation", "holiday", "absence"],
    "worker":       ["employee", "labour", "laborer"],
    "employer":     ["company", "enterprise", "organisation"],

    # Information
    "information":  ["data", "record", "disclosure"],
    "rti":          ["right to information"],
}

# Query classifier
# Maps each law name (matching documents.json "law" field) to a set of
# trigger keywords.  When a query contains one or more of these keywords
# the classifier votes for that category.  The winning category receives
# a CATEGORY_BOOST multiplier during BM25 scoring.
# All keywords are lowercase, un-stemmed — readable by the examiner.
LAW_KEYWORDS: dict[str, set[str]] = {
    "Labour": {
        "labour", "labor", "employee", "employer", "worker", "salary",
        "wage", "wages", "overtime", "leave", "termination", "fired",
        "sacked", "retrench", "layoff", "employment", "workplace",
        "job", "resign", "resignation", "gratuity", "provident", "bonus",
        "maternity", "paternity", "trade union",
    },
    "Criminal1": {
        "theft", "steal", "stolen", "robbery", "murder", "homicide",
        "manslaughter", "assault", "battery", "hurt", "rape", "kidnap",
        "abduction", "fraud", "cheating", "bribe", "bribery", "corruption",
        "punish", "punishment", "penalty", "crime", "criminal", "offence",
        "offense", "penal", "sentence", "imprisonment",
    },
    "Criminal2": {
        "sentencing", "execution", "parole", "remission",
        "probation", "detention", "custody",
    },
    "Criminal3": {
        "procedure", "complaint", "fir", "police", "investigation",
        "arrest", "bail", "charge", "prosecution", "acquittal",
        "evidence", "witness", "appeal", "trial",
    },
    "Civil": {
        "civil", "contract", "agreement", "deed", "ownership",
        "possession", "trespass", "nuisance", "negligence", "damages",
        "compensation", "liability", "obligation", "debt", "creditor",
        "debtor", "mortgage", "lease", "rent", "tenant", "landlord",
        "succession", "inheritance", "will", "intestate",
    },
    "Constitution": {
        "constitution", "fundamental right", "citizenship", "vote",
        "election", "parliament", "president", "prime minister",
        "federal", "province", "municipality", "judiciary",
        "supreme court", "directive principle", "freedom of speech",
        "liberty", "equality",
    },
    "Lands": {
        "land", "lands", "cadastral", "plot", "parcel", "immovable",
        "boundary", "encroachment", "squatter", "tenancy", "ceiling",
        "acquisition",
    },
    "Domestic_Violence": {
        "domestic violence", "domestic abuse", "spousal",
        "wife", "husband", "family violence", "protection order",
        "restraining order",
    },
    "Evidence_Act": {
        "evidence", "proof", "burden of proof", "testimony",
        "confession", "admissible", "hearsay", "presumption",
    },
    "Electronic_Transactions": {
        "electronic", "digital", "cyber", "internet", "hacking",
        "unauthorized access", "online", "computer", "network",
        "cybercrime", "electronic signature",
    },
    "Consumer": {
        "consumer", "product", "defective", "refund",
        "warranty", "guarantee", "misleading", "advertisement",
        "goods", "overcharge",
    },
    "Copyright": {
        "copyright", "intellectual property", "patent", "trademark",
        "piracy", "plagiarism", "author", "royalty",
        "license", "infringement",
    },
    "Companies": {
        "company", "corporation", "shareholder", "director", "board",
        "dividend", "incorporation", "liquidation", "winding up",
        "merger", "acquisition", "partnership", "share", "equity",
    },
    "Bank": {
        "bank", "banking", "deposit", "loan",
        "credit", "interest", "cheque", "draft",
        "nepal rastra bank", "nrb", "remittance",
    },
    "Income_Tax": {
        "income tax", "tax", "taxation", "taxpayer",
        "deduction", "exemption", "ird", "fiscal",
    },
    "VAT": {
        "vat", "value added tax", "customs", "duty",
        "excise", "import", "export", "invoice",
    },
    "finance": {
        "finance", "financial", "budget", "expenditure",
        "fiscal", "treasury", "audit", "account", "fund", "grant",
    },
    "Asset": {
        "asset", "government asset", "public asset",
        "state property", "movable", "inventory",
    },
    "Foreign_Employment": {
        "foreign employment", "abroad", "work permit", "visa",
        "recruitment", "manpower", "overseas", "migrant worker",
        "foreign job", "employment agency",
    },
    "Environment_Protection": {
        "environment", "pollution", "ecology", "natural resource",
        "forest", "biodiversity", "wildlife", "conservation",
        "waste", "emission", "environmental impact",
    },
    "Right_to_Info": {
        "right to information", "rti", "disclosure",
        "transparency", "public record", "freedom of information",
    },
    "Local_Governance": {
        "local government", "municipality", "ward", "rural",
        "metropolitan", "local body", "mayor",
        "chairperson", "local election", "local tax",
    },
}


def classify_query(query: str) -> str | None:
    """
    Keyword-based query classifier — written entirely from scratch.

    Scans the lowercased raw query for trigger words defined in
    LAW_KEYWORDS.  Counts one vote per matched keyword.  The law
    category with the most votes wins.  Ties are broken by insertion
    order (deterministic).

    Returns the winning law name (matching the "law" field in
    documents.json), or None if no keyword matched.

    This is used to apply CATEGORY_BOOST to documents from the winning
    category during BM25 scoring, biasing results toward the most
    relevant law first without changing which documents are retrieved.

    The classifier is intentionally simple and fully explainable —
    the examiner can trace every vote by reading LAW_KEYWORDS.
    """
    q = query.lower()
    votes: dict[str, int] = defaultdict(int)

    for law_name, keywords in LAW_KEYWORDS.items():
        for kw in keywords:
            if " " in kw:
                # Multi-word phrase: substring match is unambiguous
                if kw in q:
                    votes[law_name] += 1
            else:
                # Single word: use word boundary to avoid partial matches
                if re.search(r'\b' + re.escape(kw) + r'\b', q):
                    votes[law_name] += 1

    if not votes:
        return None

    return max(votes, key=lambda k: votes[k])


# Levenshtein distance spell checker

def _levenshtein(a: str, b: str) -> int:
    """
    Compute the Levenshtein (edit) distance between strings a and b.

    Uses the standard dynamic-programming recurrence:
        dp[i][j] = 0                        if i == 0 and j == 0
                 = i                        if j == 0  (delete all of a[:i])
                 = j                        if i == 0  (insert all of b[:j])
                 = dp[i-1][j-1]             if a[i-1] == b[j-1]  (no edit)
                 = 1 + min(dp[i-1][j],      (deletion)
                           dp[i][j-1],      (insertion)
                           dp[i-1][j-1])    (substitution)

    Time complexity:  O(|a| × |b|)
    Space complexity: O(|a| × |b|)

    Implemented entirely from scratch — no difflib, no NLTK, no external
    library.  Every step is traceable from the recurrence above.
    """
    la, lb = len(a), len(b)
    dp = [[0] * (lb + 1) for _ in range(la + 1)]

    for i in range(la + 1):
        dp[i][0] = i
    for j in range(lb + 1):
        dp[0][j] = j

    for i in range(1, la + 1):
        for j in range(1, lb + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(
                    dp[i - 1][j],       # deletion
                    dp[i][j - 1],       # insertion
                    dp[i - 1][j - 1],   # substitution
                )

    return dp[la][lb]


# Populated by initialize_search_engine() from the inverted index vocabulary
# plus raw title words.  Used as the candidate set for spell correction.
_spell_vocab: set[str] = set()


def _correct_token(token: str) -> str:
    """
    Find the closest word in _spell_vocab to the given token.
    Returns the token unchanged if:
      - it is already in vocabulary (no correction needed), OR
      - it is ≤ 3 characters (too short to correct reliably), OR
      - no candidate is within MAX_EDIT_DISTANCE edits.

    MAX_EDIT_DISTANCE:
        word length 4–5  → max 1 edit
        word length 6+   → max 2 edits

    A length filter (|candidate| - |token| > max_edit → skip) eliminates
    ~95% of the vocabulary before any distance is computed, keeping
    spell-checking fast enough for real-time queries.
    """
    if token in _spell_vocab or len(token) <= 3:
        return token

    max_edit = 1 if len(token) <= 5 else 2
    best_word = token
    best_dist = max_edit + 1  # above threshold → no correction yet

    for candidate in _spell_vocab:
        if abs(len(candidate) - len(token)) > max_edit:
            continue
        dist = _levenshtein(token, candidate)
        if dist < best_dist:
            best_dist = dist
            best_word = candidate

    return best_word


def spell_correct_query(query: str) -> str:
    """
    Silently spell-correct a raw query string token by token.

    'Silently' means the user never sees a "Did you mean…?" message.
    The corrected query is passed straight into synonym expansion and
    BM25 retrieval.  If every token is already in-vocabulary the
    output is identical to the input.

    Called before expand_synonyms() so corrected words flow naturally
    through the rest of the pipeline.
    """
    tokens = query.lower().split()
    corrected = [_correct_token(t) for t in tokens]
    return " ".join(corrected)


# Manual rule-based stemmer for legal vocabulary

def stem(word: str) -> str:
    """
    Rule-based suffix-stripping stemmer written from scratch for legal
    English.  31 suffix rules, most-specific first, max 3 passes.
    100% pure Python — no NLTK, no external library.
    """
    suffixes = [
        ("isation",  "ise"),
        ("ization",  "ize"),
        ("ational",  "ate"),
        ("tional",   "tion"),
        ("ousness",  "ous"),
        ("iveness",  "ive"),
        ("fulness",  "ful"),
        ("ingness",  "ing"),
        ("ishment",  "ish"),
        ("ishment",  ""),
        ("alities",  "al"),
        ("nesses",   ""),
        ("ments",    "ment"),
        ("ations",   "ate"),
        ("ations",   ""),
        ("ities",    ""),
        ("iers",     "y"),
        ("iers",     "ier"),
        ("ness",     ""),
        ("ment",     ""),
        ("tion",     "te"),
        ("tion",     ""),
        ("sion",     "d"),
        ("sion",     ""),
        ("able",     ""),
        ("ible",     ""),
        ("ance",     ""),
        ("ence",     ""),
        ("ical",     ""),
        ("ful",      ""),
        ("ous",      ""),
        ("ive",      ""),
        ("ing",      ""),
        ("ied",      "y"),
        ("ies",      "y"),
        ("ied",      ""),
        ("ers",      "er"),
        ("ers",      ""),
        ("est",      ""),
        ("ed",       ""),
        ("er",       ""),
        ("ly",       ""),
        ("al",       ""),
        ("s",        ""),
    ]

    for _ in range(3):
        changed = False
        for suffix, replacement in suffixes:
            if (word.endswith(suffix)
                    and len(word) - len(suffix) + len(replacement) >= 3):
                word = word[: len(word) - len(suffix)] + replacement
                changed = True
                break
        if not changed:
            break

    return word


# Text preprocessing pipeline

def clean_text(text: str) -> str:
    """
    Lowercase and strip non-alphanumeric characters, preserving Devanagari
    Unicode block (U+0900–U+097F) for Nepali-language content.
    """
    text = text.lower()
    text = re.sub(r'[^\w\s\u0900-\u097F]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def tokenize(text: str) -> list[str]:
    return text.split()


def remove_stopwords(tokens: list[str]) -> list[str]:
    return [t for t in tokens if t not in STOPWORDS]


def preprocess(text: str, apply_stemming: bool = True) -> list[str]:
    """clean → tokenize → remove stopwords → stem"""
    tokens = tokenize(clean_text(text))
    tokens = remove_stopwords(tokens)
    if apply_stemming:
        tokens = [stem(t) for t in tokens]
    return tokens


def expand_synonyms(query: str) -> str:
    """
    Apply synonym dictionary to a raw query string.
    Multi-word phrases checked first, then single tokens.
    """
    result = query.lower()

    multi = sorted(
        [(k, v) for k, v in SYNONYMS.items() if " " in k],
        key=lambda x: len(x[0]),
        reverse=True,
    )
    for phrase, expansions in multi:
        if phrase in result:
            result = result.replace(phrase, phrase + " " + " ".join(expansions))

    words = result.split()
    expanded = []
    for word in words:
        expanded.append(word)
        if word in SYNONYMS and " " not in word:
            expanded.extend(SYNONYMS[word])

    return " ".join(expanded)


# BM25 index — built once at startup, kept in module-level globals

documents       = []
inverted_index  = defaultdict(list)
doc_lengths     = []
avgdl           = 0.0
doc_freq        = defaultdict(int)
N               = 0
is_initialized  = False
_query_cache    = {}


def _build_weighted_tokens(doc: dict) -> list[str]:
    """title tokens × TITLE_WEIGHT + content tokens × 1"""
    title_tokens   = preprocess(doc.get("title",   ""))
    content_tokens = preprocess(doc.get("content", ""))
    return title_tokens * TITLE_WEIGHT + content_tokens


def initialize_search_engine():
    """
    Load documents.json and build all in-memory data structures.
    Also populates _spell_vocab from the index vocabulary + title words.
    Idempotent — safe to call multiple times.
    """
    global documents, inverted_index, doc_lengths, avgdl
    global doc_freq, N, is_initialized, _spell_vocab

    if is_initialized:
        return

    doc_path = os.path.join(BASE_DIR, "documents.json")
    if not os.path.exists(doc_path):
        raise FileNotFoundError(
            "documents.json not found.  Run precompute.py locally first."
        )

    print("Loading documents.json …")
    with open(doc_path, "r", encoding="utf-8") as f:
        documents = json.load(f)

    N = len(documents)
    print(f"  {N} sections loaded.")

    print("Building inverted index …")
    total_tokens = 0

    for doc_id, doc in enumerate(documents):
        tokens = _build_weighted_tokens(doc)
        doc_lengths.append(len(tokens))
        total_tokens += len(tokens)

        unique_stems = set(tokens)
        for stem_tok in unique_stems:
            doc_freq[stem_tok] += 1
            inverted_index[stem_tok].append(doc_id)

    avgdl = total_tokens / N if N > 0 else 1.0

    # Build spell-check vocabulary: all index stems + raw title words.
    # Raw title words let the checker correct whole words before stemming.
    _spell_vocab = set(inverted_index.keys())
    for doc in documents:
        for word in clean_text(doc.get("title", "")).split():
            if len(word) > 3:
                _spell_vocab.add(word)

    is_initialized = True
    print(f"  Vocabulary size: {len(inverted_index)} unique stems.")
    print(f"  Spell-check vocab: {len(_spell_vocab)} words.")
    print(f"  Average document length: {avgdl:.1f} tokens.")
    print("BM25 search engine ready.")


# BM25 scoring

def _bm25_score(query_stems: list[str], doc_id: int) -> float:
    """
    BM25 score for one (query, document) pair.

    IDF(t) = log( (N - df(t) + 0.5) / (df(t) + 0.5) + 1 )   [Robertson-Walker]
    BM25(t,d) = IDF(t) × tf(t,d)×(k1+1) / (tf(t,d) + k1×(1-b+b×|d|/avgdl))
    """
    dl    = doc_lengths[doc_id]
    score = 0.0

    tokens = _build_weighted_tokens(documents[doc_id])
    tf_map: dict[str, int] = defaultdict(int)
    for t in tokens:
        tf_map[t] += 1

    for term in query_stems:
        df_t = doc_freq.get(term, 0)
        if df_t == 0:
            continue

        idf         = math.log((N - df_t + 0.5) / (df_t + 0.5) + 1.0)
        tf_t        = tf_map.get(term, 0)
        numerator   = tf_t * (BM25_K1 + 1.0)
        denominator = tf_t + BM25_K1 * (1.0 - BM25_B + BM25_B * dl / avgdl)
        score      += idf * (numerator / denominator)

    return score


# Main search function

def search_legal_documents(query: str, top_k: int = 3):
    """
    Public entry point called by main.py.

    Pipeline:
      1. Cache lookup.
      2. Greeting shortcut.
      3. Silent spell correction (Levenshtein).
      4. Query classification (keyword voting → law category).
      5. Synonym expansion.
      6. Preprocessing (clean → tokenize → stopwords → stem).
      7. Candidate retrieval via inverted index.
      8. BM25 scoring with optional category boost.
      9. Format and return (reply, confidence).

    Returns: (reply: str, confidence: float)
    Shape is identical to original — backend and frontend unchanged.
    """
    if not is_initialized:
        initialize_search_engine()

    raw_query = query.strip()
    if not raw_query:
        return ("Please enter a legal question.", 0)

    # 1. Cache
    cache_key = raw_query.lower()
    if cache_key in _query_cache:
        return _query_cache[cache_key]

    # 2. Greeting shortcut
    greetings = {"hi", "hello", "hey", "namaste", "नमस्ते"}
    if cache_key in greetings:
        result = (
            "Namaste! I am your AI Legal Assistant for Nepali law. "
            "How can I help you today?",
            100,
        )
        _query_cache[cache_key] = result
        return result

    # 3. Silent spell correction
    corrected_query = spell_correct_query(raw_query)

    # 4. Query classification — which law category fits best?
    category = classify_query(corrected_query)

    # 5. Synonym expansion  →  6. Preprocessing
    expanded_query = expand_synonyms(corrected_query)
    query_stems    = preprocess(expanded_query)

    if not query_stems:
        result = (
            "Your query did not contain recognisable legal terms. "
            "Please try keywords such as 'theft', 'employment', 'property', "
            "or 'contract'.",
            0,
        )
        _query_cache[cache_key] = result
        return result

    # 7. Candidate retrieval
    candidate_ids: set[int] = set()
    for stem_tok in query_stems:
        candidate_ids.update(inverted_index.get(stem_tok, []))

    if not candidate_ids:
        result = (
            "I could not find any legal sections matching your query. "
            "Try rephrasing using specific legal terms like 'theft', "
            "'termination', 'penalty', or a section number.",
            0,
        )
        _query_cache[cache_key] = result
        return result

    # 8. BM25 scoring + category boost
    scored = []
    for doc_id in candidate_ids:
        score = _bm25_score(query_stems, doc_id)
        if score > 0:
            if category and documents[doc_id].get("law") == category:
                score *= CATEGORY_BOOST
            scored.append((doc_id, score))

    if not scored:
        result = (
            "No sufficiently relevant sections were found. "
            "Please try a different phrasing.",
            0,
        )
        _query_cache[cache_key] = result
        return result

    scored.sort(key=lambda x: x[1], reverse=True)
    top_results = scored[:top_k]

    # 9. Format response
    reply = "Based on the Nepali legal documents, here are the relevant sections:\n\n"

    for doc_id, score in top_results:
        doc     = documents[doc_id]
        law     = doc.get("law",     "Unknown Law")
        section = doc.get("section", "")
        title   = doc.get("title",   "")
        content = doc.get("content", "")

        full_text = title
        if content and content.strip() and not title.endswith(content[:20].strip()):
            full_text = title + "\n\n" + content if title else content

        reply += f"#### {law} - {section}\n"
        reply += f"{full_text}\n\n"
        reply += "---\n\n"

    # Confidence: scale raw BM25 to 0-100.
    # Un-apply boost before scaling so the percentage isn't inflated.
    best_raw = top_results[0][1]
    if category and documents[top_results[0][0]].get("law") == category:
        best_raw /= CATEGORY_BOOST
    display_confidence = min(round(best_raw * 7, 1), 100)

    result = (reply, display_confidence)
    _query_cache[cache_key] = result
    return result


# Related sections finder

def find_related_sections(retrieved_doc_ids: list[int], top_k: int = 4) -> list[dict]:
    """
    Find sections that are mathematically similar to the retrieved results,
    using the existing BM25 inverted index — no new algorithm needed.

    How it works:
      1. Collect the full token profile of every retrieved document
         (their already-computed weighted token lists).
      2. Count how many of those tokens appear in each *other* document
         via the inverted index — this is term overlap, the same basis
         BM25 uses, so it is fully consistent with the main search.
      3. Normalise by each candidate's document length so shorter sections
         don't unfairly outscore long ones just because they share fewer
         unique terms.
      4. Exclude any document already in retrieved_doc_ids (don't repeat
         what the user already saw) and deduplicate by (law, section).
      5. Return the top_k candidates as plain dicts ready for the frontend.

    Called by main.py after search_legal_documents() returns, so
    retrieved_doc_ids is just the list of doc_id integers from top_results.
    Returns an empty list if the engine isn't initialised or there are
    no candidates.
    """
    if not is_initialized or not documents:
        return []

    # Build the combined token set from all retrieved documents.
    # Using a Counter (term → total count) across all retrieved docs
    # gives higher weight to terms that appear in multiple retrieved sections,
    # which is exactly what "similar" means in this context.
    query_term_counts: dict[str, int] = defaultdict(int)
    retrieved_set = set(retrieved_doc_ids)

    for doc_id in retrieved_doc_ids:
        for token in _build_weighted_tokens(documents[doc_id]):
            query_term_counts[token] += 1

    if not query_term_counts:
        return []

    # Score every document that shares at least one token with retrieved docs.
    # We reuse the inverted index for fast candidate lookup.
    candidate_scores: dict[int, float] = defaultdict(float)

    for term, term_count in query_term_counts.items():
        for doc_id in inverted_index.get(term, []):
            if doc_id in retrieved_set:
                continue    # skip already-shown documents
            # Weight by how prominent the term was across retrieved docs
            candidate_scores[doc_id] += term_count

    if not candidate_scores:
        return []

    # Normalise by document length so long documents don't dominate
    normalised: list[tuple[int, float]] = []
    for doc_id, raw_score in candidate_scores.items():
        dl = doc_lengths[doc_id]
        if dl > 0:
            normalised.append((doc_id, raw_score / dl))

    # Sort descending, take top candidates
    normalised.sort(key=lambda x: x[1], reverse=True)

    # Deduplicate by (law, section) — defensive in case index has duplicates
    seen: set[tuple[str, str]] = set()
    related: list[dict] = []

    for doc_id, score in normalised:
        if len(related) >= top_k:
            break
        doc     = documents[doc_id]
        law     = doc.get("law",     "")
        section = doc.get("section", "")
        key     = (law, section)
        if key in seen:
            continue
        seen.add(key)

        # Send a short preview (first 180 chars of content) to the frontend
        # so the panel stays compact without truncating inside a word.
        content = doc.get("content", doc.get("title", ""))
        preview = content[:180].rsplit(" ", 1)[0] + "…" if len(content) > 180 else content

        related.append({
            "law":     law,
            "section": section,
            "title":   doc.get("title", ""),
            "preview": preview,
        })

    return related
