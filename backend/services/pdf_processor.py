from datetime import datetime
import os
from typing import List, Dict, Any
import uuid
import PyPDF2
import pdfplumber
from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from config import settings
import logging

logger = logging.getLogger(__name__)


class PDFProcessor:
    def __init__(self):
        # TODO: Initialize text splitter with chunk size and overlap settings
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
    
    def extract_text_from_pdf(self, file_path: str) -> List[Dict[str, Any]]:
        """Extract text from PDF and return page-wise content"""
        # TODO: Implement PDF text extraction
        # - Use pdfplumber or PyPDF2 to extract text from each page
        # - Return list of dictionaries with page content and metadata
        pages_content = []
        
        try:
            with pdfplumber.open(file_path) as pdf:
                for page_num, page in enumerate(pdf.pages, 1):
                    text = page.extract_text()
                    if text and text.strip():
                        pages_content.append({
                            "page_number": page_num,
                            "content": text.strip(),
                            "metadata": {
                                "page_width": page.width,
                                "page_height": page.height,
                                "rotation": page.rotation if hasattr(page, 'rotation') else 0
                            }
                        })
        except Exception as e:
            logger.warning(f"pdfplumber failed for {file_path}, trying PyPDF2: {str(e)}")
            
            # Fallback to PyPDF2
            try:
                with open(file_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    for page_num, page in enumerate(pdf_reader.pages, 1):
                        text = page.extract_text()
                        if text and text.strip():
                            pages_content.append({
                                "page_number": page_num,
                                "content": text.strip(),
                                "metadata": {}
                            })
            except Exception as e2:
                logger.error(f"Both PDF extraction methods failed for {file_path}: {str(e2)}")
                raise Exception(f"Failed to extract text from PDF: {str(e2)}")
        
        return pages_content
        
    
    def split_into_chunks(self, pages_content: List[Dict[str, Any]], filename: str) -> List[Document]:
        """Split page content into chunks"""
        # TODO: Implement text chunking
        # - Split each page content into smaller chunks
        # - Create Document objects with proper metadata
        # - Return list of Document objects
        documents = []
        for page_data in pages_content:
            page_num = page_data["page_number"]
            content = page_data["content"]
            page_metadata = page_data["metadata"]
            
            # Split page content into chunks
            chunks = self.text_splitter.split_text(content)
            
            for chunk_idx, chunk in enumerate(chunks):
                if chunk.strip():  # Only add non-empty chunks
                    doc_metadata = {
                        "filename": filename,
                        "page": page_num,
                        "chunk_index": chunk_idx,
                        "total_chunks_in_page": len(chunks),
                        "chunk_id": str(uuid.uuid4()),
                        "upload_date": datetime.now().isoformat(),
                        **page_metadata
                    }
                    
                    documents.append(Document(
                        page_content=chunk,
                        metadata=doc_metadata
                    ))
        
        return documents
    
    def process_pdf(self, file_path: str, filename: str) -> List[Document]:
        """Process PDF file and return list of Document objects"""
        # TODO: Implement complete PDF processing pipeline
        # 1. Extract text from PDF
        # 2. Split text into chunks
        # 3. Return processed documents
        try:
            # Extract text from PDF
            pages_content = self.extract_text_from_pdf(file_path)
            
            if not pages_content:
                raise Exception("No text content found in PDF")
            
            # Split text into chunks
            documents = self.split_into_chunks(pages_content, filename)
            
            if not documents:
                raise Exception("No document chunks created")
            
            logger.info(f"Successfully processed {filename}: {len(pages_content)} pages, {len(documents)} chunks")
            return documents
            
        except Exception as e:
            logger.error(f"Error processing PDF {filename}: {str(e)}")
            raise