from fastapi import FastAPI
# from app.api.v1.router import api_router
from app.api.v1 import process_receipt
app = FastAPI(title="Expense Tracker API")
app.include_router(process_receipt.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}