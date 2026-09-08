from fastapi import APIRouter, HTTPException
from app.schemas.receipt import ReceiptProcessRequest, ReceiptProcessResponse
from app.services.ai_service import process_receipt

router = APIRouter(prefix="/ai", tags=["ai"])

@router.post("/process-receipt", response_model=ReceiptProcessResponse)
def process_receipt_endpoint(payload: ReceiptProcessRequest):
    try:
        result = process_receipt(str(payload.image_url))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI processing failed: {e}")

    return result