from typing import TypedDict


class ReceiptGraphState(TypedDict):
    image_url: str          # the uploaded image (base64), read by extract_from_image
    merchant: str             # written by extract_from_image
    amount: float              # written by extract_from_image
    currency: str             # written by extract_from_image
    date: str                  # written by extract_from_image
    retrieved_rules: str       # written by retrieve_category_rules
    category: str               # written by categorize
    confidence: float           # written by categorize
    approved: bool               # written by human_review (or auto-set if confidence high)
    reason: str                 # written by extract_from_image
