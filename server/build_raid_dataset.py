"""
build_raid_dataset.py

ONE script that does everything:
  1. Streams the RAID dataset from Hugging Face (no giant download to disk)
  2. Pass 1: collects human-written texts
  3. Pass 2: finds a matching (non-adversarial) AI-generated version of the
     SAME content for each human text
  4. Writes your two output files directly, in the exact format your app
     already reads:
        data/final/retrieval_examples.jsonl   (AI text -> human text pairs)
        data/final/styleExamples.jsonl        (human text alone, for style)

HOW TO RUN (from your project's server folder):

    pip install datasets
    python build_raid_dataset.py

BEFORE YOU RUN THIS:
  RAID's exact Hugging Face repo name and column names are my best
  recollection and may be slightly out of date -- I could not verify them
  live. Check the dataset card first:
      https://huggingface.co/datasets/liamdugan/raid
      https://raid-bench.github.io/
  If load_dataset() below errors with "repository not found", search
  "RAID dataset huggingface" to get the correct repo id and swap it in
  below (RAID_REPO). The script also prints the first row's field names
  as soon as it starts, so you can sanity-check them against what this
  script expects (model, source_id / adv_source_id, generation, domain,
  attack) -- if yours differ, adjust the field lookups below.
"""

import os
import json
import random
import hashlib

from datasets import load_dataset

# ---------------------------------------------------------------------------
# SETTINGS -- safe to tweak
# ---------------------------------------------------------------------------
RAID_REPO = "liamdugan/raid"          # verify against the dataset card
TARGET_TRANSFORMATION_COUNT = 4200    # final rows in retrieval_examples.jsonl
TARGET_STYLE_COUNT = 1600             # final rows in styleExamples.jsonl
MAX_HUMAN_SOURCES_TO_COLLECT = 20000  # caps pass 1 memory use
MAX_ROWS_TO_SCAN_PER_PASS = 3_000_000 # safety stop, in case something's off
MIN_WORDS = 15
MAX_WORDS = 200

OUTPUT_DIR = os.path.join("data", "final")
RETRIEVAL_OUT = os.path.join(OUTPUT_DIR, "retrieval_examples.jsonl")
STYLE_OUT = os.path.join(OUTPUT_DIR, "styleExamples.jsonl")

RAID_LICENSE = "See RAID dataset card (verify before shipping)"


def clean(text):
    return " ".join((text or "").split())


def word_count(text):
    return len(text.split())


def infer_complexity(text):
    words = text.split()
    if not words:
        return "Simple"
    avg_len = sum(len(w) for w in words) / len(words)
    if len(words) > 30 or avg_len > 5.5:
        return "Advanced"
    if len(words) > 15 or avg_len > 4.8:
        return "Medium"
    return "Simple"


def text_hash(text):
    return hashlib.sha256(text.lower().encode("utf-8")).hexdigest()


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("=" * 70)
    print("STEP 1: Connecting to Hugging Face (streaming mode)")
    print("=" * 70)
    ds = load_dataset(RAID_REPO, split="train", streaming=True)

    print("\nPass 1: scanning for human-written texts...")
    print("(this reads through the stream once -- can take a while, that's normal)")
    humans_by_source = {}
    checked_columns = False
    scanned = 0

    for row in ds:
        scanned += 1
        if not checked_columns:
            print("First row's fields (double check these match what this script expects):")
            print(" ", list(row.keys()))
            checked_columns = True

        if scanned > MAX_ROWS_TO_SCAN_PER_PASS:
            print(f"Hit the {MAX_ROWS_TO_SCAN_PER_PASS}-row safety cap, stopping pass 1 here.")
            break

        model = str(row.get("model", "")).lower()
        if model != "human":
            continue

        source_id = row.get("source_id") or row.get("adv_source_id") or row.get("id")
        text = clean(row.get("generation", ""))
        domain = row.get("domain", "General")

        if word_count(text) < MIN_WORDS or word_count(text) > MAX_WORDS:
            continue
        if source_id in humans_by_source:
            continue

        humans_by_source[source_id] = {"text": text, "domain": domain}

        if len(humans_by_source) >= MAX_HUMAN_SOURCES_TO_COLLECT:
            print(f"Reached {MAX_HUMAN_SOURCES_TO_COLLECT} human texts, moving to pass 2.")
            break

    print(f"\nScanned {scanned} rows, collected {len(humans_by_source)} human-written texts.")

    if not humans_by_source:
        print("\n❌ No human-written rows found. The 'model' field name/value may")
        print("   differ from what this script expects -- check the printed field")
        print("   names above against the RAID dataset card.")
        return

    print("\n" + "=" * 70)
    print("STEP 2 (Pass 2): finding a matching AI-generated version for each")
    print("=" * 70)
    ds2 = load_dataset(RAID_REPO, split="train", streaming=True)

    pairs = []
    seen_pair_hashes = set()
    remaining_sources = set(humans_by_source.keys())
    scanned2 = 0

    for row in ds2:
        scanned2 += 1
        if not remaining_sources:
            break
        if scanned2 > MAX_ROWS_TO_SCAN_PER_PASS:
            print(f"Hit the {MAX_ROWS_TO_SCAN_PER_PASS}-row safety cap, stopping pass 2 here.")
            break

        source_id = row.get("source_id") or row.get("adv_source_id") or row.get("id")
        if source_id not in remaining_sources:
            continue

        model = str(row.get("model", "")).lower()
        attack = str(row.get("attack", "none")).lower()
        if model == "human" or attack != "none":
            continue

        ai_text = clean(row.get("generation", ""))
        if word_count(ai_text) < MIN_WORDS or word_count(ai_text) > MAX_WORDS:
            continue

        human_entry = humans_by_source[source_id]
        pair_hash = text_hash(ai_text + ":::" + human_entry["text"])
        if pair_hash in seen_pair_hashes:
            continue
        seen_pair_hashes.add(pair_hash)

        pairs.append({
            "id": f"raid_{pair_hash[:12]}",
            "originalText": ai_text,
            "revisionText": human_entry["text"],
            "task": "humanize",
            "style": "Natural",
            "tone": "Natural",
            "domain": human_entry["domain"] or "General",
            "complexity": infer_complexity(human_entry["text"]),
            "language": "English",
            "source": "raid",
            "license": RAID_LICENSE,
        })

        remaining_sources.discard(source_id)

    print(f"\nScanned {scanned2} rows, built {len(pairs)} human/AI transformation pairs.")

    random.shuffle(pairs)
    final_pairs = pairs[:TARGET_TRANSFORMATION_COUNT]

    style_seen = set()
    style_candidates = []
    for entry in humans_by_source.values():
        h = text_hash(entry["text"])
        if h in style_seen:
            continue
        style_seen.add(h)
        style_candidates.append({
            "id": f"raid_style_{h[:12]}",
            "text": entry["text"],
            "style": "Natural",
            "tone": "Natural",
            "domain": entry["domain"] or "General",
            "complexity": infer_complexity(entry["text"]),
            "language": "English",
            "source": "raid",
            "license": RAID_LICENSE,
        })
    random.shuffle(style_candidates)
    final_styles = style_candidates[:TARGET_STYLE_COUNT]

    with open(RETRIEVAL_OUT, "w", encoding="utf-8") as f:
        f.write("\n".join(json.dumps(p) for p in final_pairs))
    with open(STYLE_OUT, "w", encoding="utf-8") as f:
        f.write("\n".join(json.dumps(s) for s in final_styles))

    print("\n" + "=" * 70)
    print(f"✅ Wrote {len(final_pairs)} pairs -> {RETRIEVAL_OUT}")
    print(f"✅ Wrote {len(final_styles)} style examples -> {STYLE_OUT}")
    print("=" * 70)
    print("\nNext, run (in this order):")
    print("  npm run dataset:clean")
    print("  npm run dataset:validate")
    print("  npm run dataset:import     (only if MongoDB is running)")
    print("  npm run dataset:embed      (needs Ollama running)")


if __name__ == "__main__":
    main()
