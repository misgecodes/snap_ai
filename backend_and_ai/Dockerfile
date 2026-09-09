FROM python:3.11-slim

WORKDIR /app

# System deps some packages (chromadb, psycopg2) need to build
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Render sets $PORT at runtime — don't hardcode it
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT