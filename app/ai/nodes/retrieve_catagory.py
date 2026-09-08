from states.receipt_graph_state import ReceiptGraphState
from schemas.extracted_receipt import ExtractedReceipt
from schemas.catagorization import Categorization
from langchain_text_splitters import MarkdownHeaderTextSplitter
from langchain_community.vectorstores import Chroma
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from config.settings import OPENAI_API_KEY



def retrieve_category(state: ReceiptGraphState, vectorstore: Chroma) -> dict:
    
    load_dotenv()   
    llm = ChatOpenAI(model="gpt-4.1-mini", openai_api_key=OPENAI_API_KEY)
    structured_llm = llm.with_structured_output(Categorization)

    catagory = vectorstore.similarity_search(f"Reason: {state['reason']} merchant: {state['merchant']}", k=3)
    # print(catagory)
    system_prompt = f"Based on the following retrieved rules: {catagory}, please categorize the receipt with a confidence score between 0 and 1."
    
    llm_response = structured_llm.invoke(system_prompt)
    state["category"] = llm_response.category if llm_response else "Uncategorized"
    
    return {"category": state["category"]}