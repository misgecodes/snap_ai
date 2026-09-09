import json
from app.ai.main import run_receipt_graph
import re
from datetime import datetime


def _fuzzy_match(true_val, predicted_val):
    if not true_val or not predicted_val:
        return true_val == predicted_val
    return (
        true_val.strip().lower() in predicted_val.strip().lower()
        or predicted_val.strip().lower() in true_val.strip().lower()
    )


def _normalize_date(raw):
    if not raw:
        return None
    raw = raw.strip()
    # Try common formats the AI returns
    formats = [
        "%Y-%m-%d",
        "%b %d, %Y %I:%M %p",
        "%b %d, %Y",
        "%B %d, %Y at %I:%M %p",
        "%B %d, %Y",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(raw, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return raw  # couldn't parse, leave as-is (will show as a real mismatch)


with open("eval/test_set.json") as f:
    test_set = json.load(f)

results = []

for case in test_set:
    print(f"Testing: {case['image_url']}")
    try:
        prediction = run_receipt_graph(case["image_url"])
    except Exception as e:
        print(f"  FAILED to process: {e}")
        prediction = {}

    result = {
        "image_url": case["image_url"],
        "notes": case.get("notes", ""),
        "merchant": {
            "true": case["true_merchant"],
            "predicted": prediction.get("merchant"),
            "correct": _fuzzy_match(case["true_merchant"], prediction.get("merchant")),
        },
        "amount": {
            "true": case["true_amount"],
            "predicted": prediction.get("amount"),
            "correct": prediction.get("amount") == case["true_amount"],
        },
        "currency": {
            "true": case["true_currency"],
            "predicted": prediction.get("currency"),
            "correct": prediction.get("currency") == case["true_currency"],
        },
            "date": {
            "true": case["true_date"],
            "predicted": prediction.get("date"),
            "correct": _normalize_date(prediction.get("date")) == case["true_date"],
        },
        "category": {
            "true": case["true_category"],
            "predicted": prediction.get("category"),
            "correct": prediction.get("category") == case["true_category"],
        },
    }
    results.append(result)

fields = ["merchant", "amount", "currency", "date", "category"]
accuracy = {}
for field in fields:
    correct = sum(1 for r in results if r[field]["correct"])
    accuracy[field] = correct / len(results)

with open("eval/results.json", "w") as f:
    json.dump({"results": results, "accuracy": accuracy}, f, indent=2)

print("\n=== ACCURACY SUMMARY ===")
for field, acc in accuracy.items():
    print(f"{field}: {acc:.0%}")

print("\n=== FAILURES ===")
for r in results:
    for field in fields:
        if not r[field]["correct"]:
            print(f"[{field}] {r['image_url']}")
            print(f"  true: {r[field]['true']!r} | predicted: {r[field]['predicted']!r}")
            if r["notes"]:
                print(f"  notes: {r['notes']}")