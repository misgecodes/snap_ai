from datetime import date
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseProcessRequest, ExpenseProcessResponse, ExpenseListResponse, CategorySummary
from collections import defaultdict
from app.services.ai_service import process_receipt

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["ai"])


def _parse_expense_date(raw_date: str | None) -> date | None:
    if not raw_date:
        return None
    try:
        return date.fromisoformat(raw_date)
    except ValueError:
        logger.warning("Could not parse date value: %r — storing as None", raw_date)
        return None


@router.post("/process-expense", response_model=ExpenseProcessResponse)
def process_receipt_endpoint(
    payload: ExpenseProcessRequest,
    db: Session = Depends(get_db),
):
    image_url = str(payload.image_url)
    logger.info("Starting receipt processing for image URL: %s", image_url)

    try:
        result = process_receipt(image_url)
        logger.info("AI receipt processing completed")
    except Exception as exc:
        logger.exception("AI receipt processing failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"AI processing failed: {exc}") from exc

    try:
        expense_data = ExpenseCreate(image_url=payload.image_url, **result)
        expense = Expense(
            image_url=str(expense_data.image_url),
            merchant=expense_data.merchant,
            reason=expense_data.reason,
            amount=expense_data.amount,
            category=expense_data.category,
            currency=expense_data.currency,
            expense_date=_parse_expense_date(expense_data.date),
        )
        logger.info("AI result validated and converted to an expense record")
    except Exception as exc:
        logger.exception("Failed to validate or convert the AI result: %s", exc)
        raise HTTPException(status_code=500, detail=f"Expense data conversion failed: {exc}") from exc

    try:
        db.add(expense)
        db.commit()
        logger.info("Expense saved successfully with id=%s", expense.id)
    except Exception as exc:
        logger.exception("Failed to save expense to the database: %s", exc)
        try:
            db.rollback()
            logger.info("Database transaction rolled back")
        except Exception:
            logger.exception("Database rollback also failed")
        raise HTTPException(status_code=500, detail=f"Expense persistence failed: {exc}") from exc

    return result




@router.get("/expenses", response_model=ExpenseListResponse)
def list_expenses(db: Session = Depends(get_db)):
    expenses = db.query(Expense).order_by(Expense.created_at.desc()).all()

    # category -> currency -> running total
    grouped: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
    counts: dict[str, int] = defaultdict(int)

    for exp in expenses:
        category = exp.category or "Uncategorized"
        currency = exp.currency or "USD"
        grouped[category][currency] += exp.amount or 0.0
        counts[category] += 1

    summary = [
        CategorySummary(
            category=category,
            totals_by_currency=dict(currency_totals),
            count=counts[category],
        )
        for category, currency_totals in grouped.items()
    ]

    return ExpenseListResponse(expenses=expenses, summary=summary)