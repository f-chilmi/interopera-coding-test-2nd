from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime


class ChatRequest(BaseModel):
    question: str
    chat_history: Optional[List[Dict[str, str]]] = []
    session_id: Optional[str] = None


class DocumentSource(BaseModel):
    content: str
    page: int
    score: float
    metadata: Optional[Dict[str, Any]] = {}


class ChatResponse(BaseModel):
    answer: str
    sources: List[DocumentSource]
    processing_time: float


class DocumentInfo(BaseModel):
    id: Optional[str]
    filename: str
    upload_date: datetime
    chunks_count: int
    status: str


class DocumentsResponse(BaseModel):
    documents: List[DocumentInfo]


class UploadResponse(BaseModel):
    message: str
    filename: str
    chunks_count: int
    processing_time: float


class ChunkInfo(BaseModel):
    id: str
    content: str
    page: int
    metadata: Dict[str, Any]


class ChunksResponse(BaseModel):
    chunks: List[ChunkInfo]
    total_count: int 

class FinancialMetricsRequest(BaseModel):
    revenue: Optional[float] = 0
    net_income: Optional[float] = 0
    total_assets: Optional[float] = 0
    total_liabilities: Optional[float] = 0
    shareholders_equity: Optional[float] = 0
    current_assets: Optional[float] = 0
    current_liabilities: Optional[float] = 0

class ChartRequest(BaseModel):
    type: str  # 'bar', 'line', 'pie', 'financial_metrics'
    data: Dict[str, Any]
    title: Optional[str] = "Financial Chart"

class FeedbackRequest(BaseModel):
    question: str
    answer: str
    rating: int  # 1-5 scale
    feedback_text: Optional[str] = None
    session_id: Optional[str] = None
