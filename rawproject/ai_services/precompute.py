"""
precompute.py
To run LOCALLY on our machine whenever we add or change law JSON files.
Produces: documents.json  (committed to the repo and deployed to Render)
Does NOT produce: embeddings.npy  (sentence_transformers was removed entirely)

Usage:
    cd ai_services/
    python precompute.py

Output:
    ai_services/documents.json
"""

import os
import json
import re

DATA_FOLDER = "data"


# Helpers

def _is_chapter_node(value: dict) -> bool:
    """
    Returns True when a JSON value is a chapter container rather than a
    section.  A chapter node has NO 'title' or 'content' keys — its values
    are themselves section dicts.

    """
    return "title" not in value and "content" not in value


def _iter_sections(data: dict):
    """
    Yield (section_key, section_dict) pairs regardless of whether the JSON
    uses a flat layout or a chapter-nested layout.

    Only one level of nesting is handled because that is the deepest that
    exists in the current dataset.
    """
    for key, value in data.items():
        if not isinstance(value, dict):
            continue
        if _is_chapter_node(value):
            # Recurse one level into the chapter
            for sec_key, sec_value in value.items():
                if isinstance(sec_value, dict) and (
                    "title" in sec_value or "content" in sec_value
                ):
                    yield sec_key, sec_value
        else:
            yield key, value


def _join_title_and_content(raw_title: str, raw_content: str) -> tuple:
    """
    The original text files were split at line breaks during scraping, which
    causes section titles to be cut mid-sentence.  The continuation of the
    sentence falls at the very start of 'content'.

    Strategy: always concatenate title + content into one clean string,
    then re-split

    This is safe even when the title is already complete — in that case the
    split just returns the original title plus a clean content string.
    """
    # Strip surrounding whitespace and collapse internal whitespace runs
    raw_title   = re.sub(r'\s+', ' ', raw_title.strip())
    raw_content = re.sub(r'\s+', ' ', raw_content.strip())

    # Build full text.  Insert a single space between title and content only
    # when needed (avoids double-spaces).
    if raw_title and raw_content:
        full = raw_title + " " + raw_content
    elif raw_title:
        full = raw_title
    else:
        full = raw_content

    # Find the first natural sentence boundary inside the combined text.
    # We look for: sentence-ending punctuation followed by whitespace or
    # the open-parenthesis of a sub-clause, e.g. "...Nepal. (2) The act..."
    boundary = re.search(r'[.!?:—\-]\s', full)
    if boundary:
        split_at   = boundary.end()          # include the space after the punct
        clean_title   = full[:split_at].strip()
        clean_content = full[split_at:].strip()
    else:
        # No clear boundary — keep everything in title, empty content
        clean_title   = full.strip()
        clean_content = ""

    return clean_title, clean_content


def _is_amendment_section(title: str, content: str) -> bool:
    """
    Returns True when a section is purely an amendment instruction rather
    than substantive law text.  These are useless to end-users and pollute
    search results.

    Patterns detected (case-insensitive):
        - "the following shall be substituted for section ..."
        - "the following shall be inserted after section ..."
        - "the following shall be inserted before section ..."
        - "... is hereby amended as follows"
        - "... is hereby repealed"
    """
    combined = (title + " " + content).lower().strip()
    amendment_patterns = [
        r'the following shall be substituted',
        r'the following shall be inserted',
        r'is hereby amended',
        r'is hereby repealed',
        r'shall be deleted',
        r'shall be omitted',
    ]
    return any(re.search(p, combined) for p in amendment_patterns)


# Main loader

def load_all_laws(data_folder: str) -> list:
    """
    Walk every .json file in data_folder.  For each section:
      1. Flatten nested chapters.
      2. Join title + content into clean strings.
      3. Skip amendment-only sections.
      4. Return list of dicts: {law, section, title, content}

    'content' stored here is the FULL content (not truncated) so the search
    engine never needs to re-open individual law files at query time.
    """
    documents = []

    json_files = sorted(f for f in os.listdir(data_folder) if f.endswith(".json"))
    print(f"Found {len(json_files)} law JSON files.")

    for filename in json_files:
        law_name = filename.replace(".json", "")
        filepath = os.path.join(data_folder, filename)

        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

        section_count  = 0
        skipped_amend  = 0
        skipped_empty  = 0

        for sec_key, sec_val in _iter_sections(data):
            raw_title   = sec_val.get("title",   "")
            raw_content = sec_val.get("content", "")

            # Fix title truncation: join then re-split at sentence boundary
            clean_title, clean_content = _join_title_and_content(
                raw_title, raw_content
            )

            # Skip sections with no useful text at all
            combined_text = (clean_title + " " + clean_content).strip()
            if len(combined_text) < 10:
                skipped_empty += 1
                continue

            # Skip amendment-only sections — they are instructions to editors,
            # not substantive law that a user would want to find
            if _is_amendment_section(clean_title, clean_content):
                skipped_amend += 1
                continue

            documents.append({
                "law":     law_name,
                "section": sec_key,
                "title":   clean_title,
                "content": clean_content,
            })
            section_count += 1

        print(
            f"  {law_name}: {section_count} sections loaded"
            + (f", {skipped_amend} amendment sections skipped" if skipped_amend else "")
            + (f", {skipped_empty} empty sections skipped"    if skipped_empty else "")
        )

    return documents


# Entry point

if __name__ == "__main__":
    print("=" * 60)
    print("precompute.py — building documents.json")
    print("=" * 60)

    documents = load_all_laws(DATA_FOLDER)

    print()
    print(f"Total sections indexed: {len(documents)}")

    output_path = "documents.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(documents, f, ensure_ascii=False, indent=2)

    print(f"Wrote {output_path}  ({os.path.getsize(output_path) / 1024:.1f} KB)")
    print()
    print("Done. Commit documents.json to your repo and redeploy.")
