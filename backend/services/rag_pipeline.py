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
        # TODO: Initialize RAG pipeline components
        # - Vector store service
        # - LLM client
        # - Prompt templates
        self.vector_store = vector_store
        
        # Configure Google Gemini
        genai.configure(api_key=settings.google_api_key)
        self.model = genai.GenerativeModel(settings.llm_model)
        
        # System prompt template
        self.system_prompt = """You are an expert financial analyst assistant specializing in financial statement analysis. Your task is to provide comprehensive answers about financial data based on the provided context.

FINANCIAL ANALYSIS GUIDELINES:
1. **Revenue Analysis**: When asked about revenue, provide total figures, growth rates, and segment breakdowns if available
2. **Profitability Metrics**: Calculate and explain profit margins, operating profit growth, net income changes
3. **Cost Analysis**: Identify and categorize main cost items (COGS, operating expenses, interest, taxes)
4. **Cash Flow Assessment**: Analyze operating, investing, and financing cash flows; comment on liquidity
5. **Financial Ratios**: Calculate debt ratios, current ratios, ROE, ROA when data is available
6. **Trend Analysis**: Compare year-over-year changes and identify patterns
7. **Context Citation**: Always reference specific pages and sections from the source documents

RESPONSE FORMAT:
- Start with a direct answer to the question
- Provide specific numbers with currency and time periods
- Include relevant calculations and percentages
- Cite page references for all data points
- If data is incomplete, clearly state what's missing

IMPORTANT: Base your analysis ONLY on the provided context. If information is not available in the context, explicitly state this limitation.

Context from financial documents:
{context}

Previous conversation (if any):
{chat_history}

Question: {question}

Please provide a comprehensive answer based on the document context above.
"""
        # self.system_prompt = """You are an AI assistant specialized in analyzing financial documents and statements. 
        # Your role is to provide accurate, helpful answers based on the provided document context.

        # Guidelines:
        # 1. Base your answers primarily on the provided context from the documents
        # 2. If information is not available in the context, clearly state this
        # 3. For financial data, provide specific numbers and calculations when available
        # 4. Always cite which document or page your information comes from
        # 5. Be concise but thorough in your explanations
        # 6. If asked about financial metrics, provide both the values and their implications

        # Context from documents:
        # {context}

        # Chat History:
        # {chat_history}

        # Question: {question}

        # Please provide a comprehensive answer based on the document context above."""

    
    async def generate_answer(self, question: str, chat_history: List[Dict[str, str]] = None) -> Dict[str, Any]:
        """Generate answer using RAG pipeline"""
        # TODO: Implement RAG pipeline
        # 1. Retrieve relevant documents
        # 2. Generate context from retrieved documents
        # 3. Generate answer using LLM
        # 4. Return answer with sources
        try:
            # Retrieve relevant documents
            relevant_docs = await self._retrieve_documents(question)
            print(87, relevant_docs)
            
            # Generate context from retrieved documents
            context = self._generate_context(relevant_docs)
            
            # Generate answer using LLM
            answer = self._generate_llm_response(question, context, chat_history)
            print('answer -> ', answer)
            
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
        # TODO: Implement document retrieval
        # - Search vector store for similar documents
        # - Filter by similarity threshold
        # - Return top-k documents
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
        # TODO: Generate context string from documents
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
        # TODO: Implement LLM response generation
        # - Create prompt with question and context
        # - Call LLM API
        # - Return generated response
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
     