from datetime import date as date_type
from app.ai.main import run_receipt_graph

def process_receipt(image_url: str) -> dict:
    result = run_receipt_graph(image_url)
    print(f"Processed receipt result: {result}")

    return {
        "merchant": result.get("merchant"),
        "reason": result.get("reason"),
        "amount": result.get("amount"),
        "category": result.get("category"),
        "currency": result.get("currency") or "USD",
        "date": result.get("date") or date_type.today().strftime("%Y-%m-%d"),
    }