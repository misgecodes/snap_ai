# from type.graph_state import GraphState
from config.settings import OpenAI_API_KEY
from langchain_openai import ChatOpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter, MarkdownHeaderTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from nodes.extract_from_image import extract_from_image
from nodes.retrieve_catagory import retrieve_category
from langgraph.graph import StateGraph, END
from states.receipt_graph_state import ReceiptGraphState
from functools import partial


llm = ChatOpenAI(model="gpt-4.1-mini", openai_api_key=OpenAI_API_KEY)



with open("catagory_rules.txt", "r") as file:
    catagory_rules = file.read()
splitter = MarkdownHeaderTextSplitter(headers_to_split_on=[("##", "category")])
chunks = splitter.split_text(catagory_rules)



embeddings = OpenAIEmbeddings()
vectorestore = Chroma.from_documents(chunks, embeddings)


builder = StateGraph(ReceiptGraphState)
builder.add_node("extract", extract_from_image)
builder.add_node("categorize", partial(retrieve_category, vectorstore=vectorestore))

builder.set_entry_point("extract")
builder.add_edge("extract", "categorize")
builder.add_edge("categorize", END)
graph = builder.compile()

result = graph.invoke({
    "image_url": "https://res.cloudinary.com/dxluyadpx/image/upload/v1788473138/screenshot2_r5siie.jpg",
    "merchant": "",
    "amount": 0.0,
    "date": "",
    "reason": "",
    "retrieved_rules": "",
    "category": "",
    "confidence": 0.0,
    "currency": "",

})

print(result)
