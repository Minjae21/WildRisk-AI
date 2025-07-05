import gradio as gr
from openai import OpenAI
from dotenv import load_dotenv
import os
import datetime
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from duckduckgo_search import DDGS
from typing import List, Optional, Dict, Any
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain_core.messages import AIMessage, HumanMessage
from langchain.memory import ConversationBufferMemory

load_dotenv()

client = OpenAI(
    api_key=os.getenv("TOGETHER_API_KEY"),
    base_url="https://api.together.xyz/v1",
)

class RAGPipeline:
    def __init__(self):
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        self.vectorstore = None
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        self.memory = ConversationBufferMemory(
            return_messages=True,
            memory_key="chat_history",
            input_key="input"
        )

    def load_documents(self, file_paths: List[str]) -> str:
        all_chunks = []
        for file_path in file_paths:
            loader = PyPDFLoader(file_path)
            pages = loader.load()
            chunks = self.text_splitter.split_documents(pages)
            all_chunks.extend(chunks)
        self.vectorstore = FAISS.from_documents(all_chunks, self.embeddings)
        return f"Loaded {len(all_chunks)} chunks from {len(file_paths)} documents"

    def retrieve(self, query: str, k: int = 3) -> List[str]:
        if not self.vectorstore:
            return []
        docs = self.vectorstore.similarity_search(query, k=k)
        return [doc.page_content for doc in docs]

    def web_search(self, query: str, num_results: int = 3) -> Optional[List[str]]:
        try:
            with DDGS() as ddgs:
                results = [r for r in ddgs.text(query, max_results=num_results)]
                return [f"Title: {res['title']}\nURL: {res['href']}\nSnippet: {res['body']}" for res in results]
        except Exception as e:
            print(f"Web search error: {e}")
            return None

    def get_cal_fire_incidents(self) -> Optional[str]:
        try:
            with DDGS() as ddgs:
                results = [r for r in ddgs.text("CAL FIRE current incidents site:fire.ca.gov", max_results=3)]
                if results:
                    return "\n".join([f"🔥 {res['title']}\n{res['href']}\n{res['body']}" for res in results])
                return None
        except Exception as e:
            print(f"Error getting CAL FIRE incidents: {e}")
            return None

    def generate_citations(self, documents: List[str]) -> str:
        citations = []
        for i, doc in enumerate(documents, 1):
            citations.append(f"[{i}] Document excerpt: {doc[:200]}...")
        return "\n".join(citations)

# Initialize RAG pipeline
rag_pipeline = RAGPipeline()

# Create prompt templates
def create_prompt_templates() -> ChatPromptTemplate:
    system_template = """You are a helpful AI assistant specializing in wildfire information.

For wildfire-related questions:
1. Always prioritize the most recent information
2. Include evacuation info if available
3. Mention containment percentages
4. Provide official sources like CAL FIRE when possible

Document Context:
{context}

Citations:
{citations}

Web Search Results:
{web_context}

Current CAL FIRE Incidents:
{fire_incidents}

Always cite sources and include timestamps for wildfire information."""

    system_prompt = SystemMessagePromptTemplate.from_template(system_template)
    human_prompt = HumanMessagePromptTemplate.from_template("{input}")

    return ChatPromptTemplate.from_messages([system_prompt, human_prompt])

prompt_template = create_prompt_templates()

def should_use_web_search(query: str) -> bool:
    platform_keywords = ["linkedin", "twitter", "facebook", "instagram", "github"]
    general_keywords = ["current", "recent", "latest", "today", "now", "2024", "2025", "update", "news", "weather", "stock", "price", "who is", "what is"]
    wildfire_keywords = ["wildfire", "fire", "burn", "evacuation", "cal fire", "forest fire", "brush fire", "fire map", "fire status"]

    if any(keyword in query.lower() for keyword in wildfire_keywords):
        return True
    return any(keyword in query.lower() for keyword in platform_keywords + general_keywords)

def format_messages_for_api(messages: List) -> List[Dict[str, str]]:
    """Convert LangChain messages to OpenAI API format"""
    api_messages = []
    for msg in messages:
        if isinstance(msg, HumanMessage):
            api_messages.append({"role": "user", "content": msg.content})
        elif isinstance(msg, AIMessage):
            api_messages.append({"role": "assistant", "content": msg.content})
        elif hasattr(msg, "content"):  # System message
            api_messages.append({"role": "system", "content": msg.content})
    return api_messages

def chatbot(message: str, history: List[tuple]) -> str:
    try:
        # Check for wildfire-related queries
        is_wildfire_query = any(keyword in message.lower() for keyword in ["wildfire", "fire"])

        if is_wildfire_query:
            message = f"{message} (last 24 hours)"

        # Document context retrieval
        doc_context = "\n\n".join(rag_pipeline.retrieve(message))
        citations = rag_pipeline.generate_citations(rag_pipeline.retrieve(message)) if doc_context else "No citations available"

        # Web search context
        web_context = None
        if should_use_web_search(message):
            web_results = rag_pipeline.web_search(message)
            if web_results:
                web_context = "\n\n".join(web_results)
                web_context += f"\n\nLast updated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"

        # Get CAL FIRE incidents if relevant
        fire_incidents = ""
        if is_wildfire_query:
            fire_incidents = rag_pipeline.get_cal_fire_incidents() or "No current CAL FIRE incidents found"

        # Format messages with LangChain prompt template
        prompt = prompt_template.format_messages(
            context=doc_context or "No document context available",
            citations=citations,
            web_context=web_context or "No web search results available",
            fire_incidents=fire_incidents,
            input=message
        )

        # Add conversation history
        messages = []
        for user_msg, bot_msg in history:
            messages.extend([
                HumanMessage(content=user_msg),
                AIMessage(content=bot_msg)
            ])

        messages = prompt[:1] + messages + prompt[1:]  # Insert system prompt first

        # Convert messages to API format
        api_messages = format_messages_for_api(messages)

        # Save current interaction to memory
        rag_pipeline.memory.save_context({"input": message}, {"output": ""})

        response = client.chat.completions.create(
            model="mistralai/Mixtral-8x7B-Instruct-v0.1",
            messages=api_messages,
            temperature=0.7,
            max_tokens=1024
        )

        result = response.choices[0].message.content
        if is_wildfire_query:
            result = f"⚠️ Latest wildfire information (refreshed hourly):\n\n{result}"
        return result

    except Exception as e:
        return f"Error: {str(e)}"

with gr.Blocks() as demo:
    gr.Markdown("# Mixtral Chatbot with Enhanced RAG")

    with gr.Tab("Chat"):
        chat_interface = gr.ChatInterface(
            chatbot,
            examples=[
                "Hello!",
                "What's in the document?",
                "What are the latest news about wildfires in California?",
                "Explain the key concepts from the uploaded documents"
            ]
        )

    with gr.Tab("Upload Documents"):
        file_input = gr.File(
            label="Upload PDF(s)",
            file_types=[".pdf"],
            file_count="multiple"
        )
        load_btn = gr.Button("Load Documents")
        load_status = gr.Textbox(label="Status")

        load_btn.click(
            fn=lambda files: rag_pipeline.load_documents([f.name for f in files]),
            inputs=file_input,
            outputs=load_status
        )

    with gr.Tab("Memory Management"):
        clear_mem_btn = gr.Button("Clear Conversation Memory")
        mem_status = gr.Textbox(label="Memory Status")

        clear_mem_btn.click(
            fn=lambda: (rag_pipeline.memory.clear(), "Memory cleared!"),
            outputs=mem_status
        )

if __name__ == "__main__":
    demo.launch()