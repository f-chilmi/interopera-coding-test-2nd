from typing import List, Dict, Any
from langchain.schema import Document
from models.schemas import DocumentSource
from services.vector_store import VectorStoreService
from config import settings
import logging
import google.generativeai as genai

logger = logging.getLogger(__name__)


class RAGPipeline:
    def __init__(self, vector_store: VectorStoreService):
        self.vector_store = vector_store
        
        # Configure Google Gemini
        genai.configure(api_key=settings.google_api_key)
        self.model = genai.GenerativeModel(settings.llm_model)
        
        # System prompt template
        self.system_prompt = """You are a financial analyst assistant. Deliver precise analysis based on the provided financial documents.

Core Requirements:
1. Answer using ONLY the provided document context
2. Include exact figures with calculations when data is available
3. Cite specific page numbers or document sections for all data
4. Explicitly state when required information is missing from context
5. Balance brevity with comprehensive coverage
6. For financial metrics, present both numerical values and business significance
7. Lead with direct answers, followed by supporting analysis

Key Areas: Revenue performance, profit margins, cost structure, cash flows, financial ratios, and period-over-period comparisons as relevant.

Context from financial documents:
{context}
Previous conversation (if any):
{chat_history}
Question: {question}"""

    async def generate_answer(self, question: str, chat_history: List[Dict[str, str]] = None) -> Dict[str, Any]:
        """Generate answer using RAG pipeline"""
        try:
            # Retrieve relevant documents
            relevant_docs = await self._retrieve_documents(question)
            
            # Generate context from retrieved documents
            context = self._generate_context(relevant_docs)
            
            # Generate answer using LLM
            answer = self._generate_llm_response(question, context, chat_history)
            
            # Prepare sources
            sources = self._prepare_sources(relevant_docs)
            
            return {
                "answer": answer,
                "sources": sources
            }
            
        except Exception as e:
            logger.error(f"Error in RAG pipeline: {str(e)}")
            raise
    
    async def _retrieve_documents(self, query: str) -> List[Document]:
        """Retrieve relevant documents for the query"""
        try:
            # Expand query with financial keywords if relevant
            expanded_query = self._expand_financial_query(query)
            
            # Search vector store for similar documents
            results = self.vector_store.similarity_search(
                expanded_query, 
                k=settings.max_retrieval_documents
            )
            
            logger.info(f"Retrieved {len(results)} relevant documents for query")
            return results
            
        except Exception as e:
            logger.error(f"Error retrieving documents: {str(e)}")
            return []
        
    def _expand_financial_query(self, query: str) -> str:
        """Expand query with relevant financial terms"""
        financial_keywords = {
            "revenue": ["sales", "income", "turnover"],
            "profit": ["earnings", "net income", "profit margin"],
            "debt": ["liabilities", "borrowings", "obligations"],
            "assets": ["total assets", "current assets", "fixed assets"],
            "cash flow": ["operating cash flow", "free cash flow", "cash position"],
            "ratios": ["financial ratios", "performance metrics", "key indicators"]
        }
        
        query_lower = query.lower()
        for key, synonyms in financial_keywords.items():
            if key in query_lower:
                return f"{query} {' '.join(synonyms)}"
        
        return query
    
    def _generate_context(self, documents: List[Document]) -> str:
        """Generate context from retrieved documents"""
        if not documents:
            return "No relevant documents found."
        
        context_parts = []
        for i, (doc, score) in enumerate(documents, 1):
            filename = doc.metadata.get('filename', 'Unknown')
            page = doc.metadata.get('page', 'Unknown')
            
            context_parts.append(
                f"Document {i} (from {filename}, page {page}, relevance: {score:.2f}):\n"
                f"{doc.page_content}\n"
            )
        logger.info(f"Generated context from {len(documents)} documents")
        return "\n".join(context_parts)
    
    def _generate_llm_response(self, question: str, context: str, chat_history: List[Dict[str, str]] = None) -> str:
        """Generate response using LLM"""
        try:
            # Format chat history
            history_text = ""
            if chat_history:
                history_parts = []
                for exchange in chat_history[-10:]:  # Last 5 exchanges
                    role = exchange.get('role', 'user')
                    content = exchange.get('content', '')
                    history_parts.append(f"{role.capitalize()}: {content}")
                history_text = "\n".join(history_parts)
            
            # Create prompt
            prompt = self.system_prompt.format(
                context=context,
                chat_history=history_text,
                question=question
            )
            
            # Generate response
            response = self.model.generate_content(prompt)
            
            if response.text:
                return response.text.strip()
            else:
                return "I apologize, but I couldn't generate a response. Please try rephrasing your question."
                
        except Exception as e:
            logger.error(f"Error generating LLM response: {str(e)}")
            return f"I encountered an error while processing your question. Please try again."
        

    def _prepare_sources(self, documents: List[tuple]) -> List[DocumentSource]:
        """Prepare sources from retrieved documents"""
        sources = []
        
        for doc, score in documents:
            sources.append(DocumentSource(
                content=doc.page_content[:500] + "..." if len(doc.page_content) > 500 else doc.page_content,
                page=doc.metadata.get('page', 0),
                score=float(score),
                metadata=doc.metadata
            ))
        
        return sources
     