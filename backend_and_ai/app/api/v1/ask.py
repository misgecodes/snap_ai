# app/api/v1/ask.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from langchain_openai import ChatOpenAI

from app.db.session import get_db
from app.auth.dependencies import get_current_user
from app.models.expense import Expense
from config.settings import OPENAI_API_KEY

router = APIRouter(prefix="/ai", tags=["ai"])
llm = ChatOpenAI(model="gpt-4.1-mini", openai_api_key=OPENAI_API_KEY)


class AskRequest(BaseModel):
    question: str


@router.post("/ask")
def ask_endpoint(
    payload: AskRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    expenses = db.query(Expense).filter(Expense.user_id == current_user["id"]).all()
    print(expenses)
    expense_data = [
    {
        "merchant": e.merchant,
        "amount": e.amount,
        "currency": e.currency,
        "expense_date": str(e.expense_date) if e.expense_date else None,
        "category": e.category,
        "reason": e.reason,
        "created_at": e.created_at.strftime("%Y-%m-%d %H:%M") if e.created_at else None,
        "updated_at": e.updated_at.strftime("%Y-%m-%d %H:%M") if e.updated_at else None,
    }
    for e in expenses
]
    # for item in expense_data:
        # print(f"merchant={item['merchant']!r}, date={item['date']!r}")
    prompt = f"""You are a helpful assistant answering questions about the user's expenses.
Use ONLY the data below — do not make anything up. If the data doesn't contain the answer, say so.

Expenses:
{expense_data}

Question: {payload.question}

Answer clearly and concisely."""

    response = llm.invoke(prompt)
    return {"answer": response.content}