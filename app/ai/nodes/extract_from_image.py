from langchain_classic.schema import HumanMessage
from openai import api_key
from openai import api_key

from states.receipt_graph_state import ReceiptGraphState
from schemas.extracted_receipt import ExtractedReceipt
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_community.vectorstores import Chroma
from config.settings import OPENAI_API_KEY



def extract_from_image(state: ReceiptGraphState) -> dict:
    # Implementation for extracting information from image
    load_dotenv()
    llm = ChatOpenAI(model="gpt-4.1-mini", openai_api_key=OPENAI_API_KEY)
    structured_llm = llm.with_structured_output(ExtractedReceipt)

    response=structured_llm.invoke([HumanMessage(content=
                                        [{"type": "text", "text": "Extract the merchant, amount, date, and reason from the receipt image."},
                                         {"type": "image_url", "image_url": {"url": state["image_url"]}}
                                             ])
                                        ])
    state["merchant"] = response.merchant
    state["amount"] = response.amount
    state["date"] = response.date
    state["reason"] = response.reason
    state["currency"] = response.currency

    # print(f"Extracted merchant: {state['merchant']}, amount: {state['amount']}, date: {state['date']}, reason: {state['reason']}")

    return {"merchant": state["merchant"], "amount": state["amount"], "date": state["date"], "reason": state["reason"], "currency": state["currency"]}