# config/settings.py
import os
from dotenv import load_dotenv

# Loads .env into the environment — runs once, the first time this module is imported
load_dotenv()

# --- Required secrets ---
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# --- Database ---
DATABASE_URL = os.getenv("DATABASE_URL")

# --- Optional / has sane defaults ---
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")   # "development" | "production"
CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")

# --- Fail fast on missing required vars ---
_required = {
    "OPENAI_API_KEY": OPENAI_API_KEY,
    "DATABASE_URL": DATABASE_URL,
}

# _missing = [name for name, value in _required.items() if not value]
# if _missing:
#     raise RuntimeError(f"Missing required environment variables: {', '.join(_missing)}")