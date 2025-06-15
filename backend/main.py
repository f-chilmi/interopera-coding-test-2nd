from typing import Optional
import uuid
from fastapi import FastAPI, Query, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from services.evaluation_service import EvaluationService
from services.highlighting_service import HighlightingService
from models.schemas import ChatRequest, ChatResponse, DocumentsResponse, FeedbackRequest, UploadResponse
from services.pdf_processor import PDFProcessor
from services.rag_pipeline import RAGPipeline
from config import settings
import logging
import time
import os
from services.vector_store import vector_store_instance as vector_store

# Configure logging
logging.basicConfig(level=settings.log_level)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="RAG-based Financial Statement Q&A System",
    description="AI-powered Q&A system for financial documents using RAG",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
pdf_processor = PDFProcessor()
rag_pipeline = RAGPipeline(vector_store)
evaluation_service = EvaluationService()
highlighting_service = HighlightingService()

conversation_histories = {}


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting RAG Q&A System...")

    # Create upload directory if it doesn't exist
    os.makedirs(settings.upload_directory, exist_ok=True)

    # Initialize vector store
    await vector_store.initialize()

    logger.info("RAG Q&A System initialized successfully")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "RAG-based Financial Statement Q&A System is running"}


@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """Upload and process PDF file"""

    start_time = time.time()
    try:
        # Validate file type (PDF)
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Check file size
        file_content = await file.read()
        if len(file_content) > settings.max_file_size:
            raise HTTPException(status_code=413, detail="File is too large")
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        filename = f"{file_id}_{file.filename}"
        file_path = os.path.join(settings.upload_directory, filename)
        
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
        
        # Process PDF and extract text
        documents = pdf_processor.process_pdf(file_path, file.filename)
        
        # Store documents in vector database
        vector_store.add_documents(documents, file_id)
       
        logger.info(f"Successfully processed {file.filename}: {len(documents)} chunks created")
       
        processing_time = time.time() - start_time
        
        return UploadResponse(
            message="PDF uploaded and processed successfully",
            filename=file.filename,
            chunks_count=len(documents),
            processing_time=processing_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing PDF {file.filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")


@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Process chat request and return AI response"""
    start_time = time.time()
    
    try:
        # Generate session ID if not provided
        session_id = getattr(request, 'session_id', str(uuid.uuid4()))
        
        # Get or create conversation history
        if session_id not in conversation_histories:
            conversation_histories[session_id] = []
        
        chat_history = conversation_histories[session_id]
        
        # Use RAG pipeline to generate answer
        result = await rag_pipeline.generate_answer(
            question=request.question,
            chat_history=chat_history
        )
        
        # Update conversation history
        chat_history.append({"role": "user", "content": request.question})
        chat_history.append({"role": "assistant", "content": result["answer"]})
        
        # Keep only last 10 exchanges to manage memory
        if len(chat_history) > 20:
            chat_history = chat_history[-20:]
        
        conversation_histories[session_id] = chat_history
        
        processing_time = time.time() - start_time
        
        return ChatResponse(
            answer=result["answer"],
            sources=result["sources"],
            processing_time=processing_time
        )
        
    except Exception as e:
        logger.error(f"Error processing chat request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")



@app.get("/api/documents")
async def get_documents():
    """Get list of processed documents"""
    try:
        documents = await vector_store.get_documents_info()
        return DocumentsResponse(documents=documents)
    except Exception as e:
        logger.error(f"Error retrieving documents: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving documents")



@app.get("/api/chunks")
async def get_chunks(
    document_id: Optional[str] = Query(None, description="Filter by document ID"),
    page: Optional[int] = Query(None, description="Filter by page number"),
    limit: int = Query(100, description="Maximum number of chunks to return")

):
    """Get document chunks"""
    try:
        chunks = await vector_store.get_chunks(
            document_id=document_id,
            page=page,
            limit=limit
        )
        return chunks
    except Exception as e:
        logger.error(f"Error retrieving chunks: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving chunks")


@app.delete("/api/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a specific document and its chunks"""
    try:
        vector_store.delete_document(document_id)
        return {"message": f"Document {document_id} deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting document: {str(e)}")
        raise HTTPException(status_code=500, detail="Error deleting document")


@app.post("/api/feedback")
async def submit_feedback(request: FeedbackRequest):
    """Submit user feedback for answer quality evaluation"""
    try:
        success = evaluation_service.save_feedback(request.dict())
        if success:
            return {"message": "Feedback submitted successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to save feedback")
    except Exception as e:
        logger.error(f"Error submitting feedback: {str(e)}")
        raise HTTPException(status_code=500, detail="Error submitting feedback")


@app.get("/api/feedback-stats")
async def get_feedback_stats():
    """Get feedback statistics and metrics"""
    try:
        stats = evaluation_service.get_feedback_stats()
        return stats
    except Exception as e:
        logger.error(f"Error getting feedback stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving feedback statistics")

@app.post("/api/highlight-chunks")
async def highlight_chunks(request: dict):
    """Get highlighted document chunks for a query"""
    try:
        query = request.get("query", "")
        document_id = request.get("document_id")
        
        # Get chunks for the document
        chunks_response = await vector_store.get_chunks(document_id=document_id)
        
        # Convert to format expected by highlighting service
        documents = [
            {
                "content": chunk.content,
                "page": chunk.page,
                "metadata": chunk.metadata,
                "id": chunk.id
            }
            for chunk in chunks_response.chunks
        ]
        
        # Add highlighting
        highlighted_docs = highlighting_service.highlight_relevant_chunks(query, documents)
        
        return {"highlighted_chunks": highlighted_docs}
        
    except Exception as e:
        logger.error(f"Error highlighting chunks: {str(e)}")
        raise HTTPException(status_code=500, detail="Error highlighting document chunks")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.host, port=settings.port, reload=settings.debug) 