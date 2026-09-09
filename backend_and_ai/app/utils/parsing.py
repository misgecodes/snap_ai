from datetime import date
import logging

logger = logging.getLogger(__name__)


def _parse_expense_date(raw_date: str | None) -> date | None:
    if not raw_date:
        return None
    try:
        return date.fromisoformat(raw_date)
    except ValueError:
        logger.warning("Could not parse date value: %r — storing as None", raw_date)
        return None

    
def normalize_currency(raw: str | None) -> str:
    if not raw:
        return "USD"
    raw = raw.strip().upper()
    symbol_map = {
        "$": "USD",
        "€": "EUR",
        "£": "GBP",
        "FRW": "RWF",
        "EURO": "EUR",
        "EUROS": "EUR",
        "DOLLAR": "USD",
        "DOLLARS": "USD",
    }
    return symbol_map.get(raw, raw)