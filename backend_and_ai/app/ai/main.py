import os
from config.settings import OPENAI_API_KEY
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_text_splitters import MarkdownHeaderTextSplitter
from langchain_community.vectorstores import Chroma
from langgraph.graph import StateGraph, END
from functools import partial

from app.ai.nodes.extract_from_image import extract_from_image
from app.ai.nodes.retrieve_catagory import retrieve_category
from app.ai.states.receipt_graph_state import ReceiptGraphState

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RULES_PATH = os.path.join(BASE_DIR, "catagory_rules.txt")

llm = ChatOpenAI(model="gpt-4.1-mini", openai_api_key=OPENAI_API_KEY)


def _build_vectorstore() -> Chroma:
    with open(RULES_PATH, "r") as file:
        category_rules = file.read()

    splitter = MarkdownHeaderTextSplitter(headers_to_split_on=[("##", "category")])
    chunks = splitter.split_text(category_rules)

    embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)
    return Chroma.from_documents(chunks, embeddings)


def _build_graph(vectorstore: Chroma):
    builder = StateGraph(ReceiptGraphState)
    builder.add_node("extract", extract_from_image)
    builder.add_node("categorize", partial(retrieve_category, vectorstore=vectorstore))

    builder.set_entry_point("extract")
    builder.add_edge("extract", "categorize")
    builder.add_edge("categorize", END)

    return builder.compile()


# Built once, at module import — reused across every call
_vectorstore = _build_vectorstore()
_graph = _build_graph(_vectorstore)


def run_receipt_graph(image_url: str) -> dict:
    """Entry point for the AI service layer — runs the full pipeline for one document."""
    return _graph.invoke({
        "image_url": image_url,
        "merchant": "",
        "amount": 0.0,
        "date": "",
        "reason": "",
        "retrieved_rules": "",
        "category": "",
        "confidence": 0.0,
        "currency": "",
    })


if __name__ == "__main__":
    # Manual test run — only executes when you run this file directly,
    test_url = "https://res.cloudinary.com/dxluyadpx/image/upload/v1788460571/ChatGPT_Image_Sep_3_2026_08_35_09_PM_fww8cp.png"
    result = run_receipt_graph(test_url)
    print(result)