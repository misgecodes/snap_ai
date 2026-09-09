from fastapi import FastAPI

from app.api.v1 import process_expense, auth
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Expense Tracker API")
app.include_router(process_expense.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")



app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}