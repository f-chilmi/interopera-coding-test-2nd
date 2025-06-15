from datetime import datetime
import os
from typing import List, Optional, Tuple
from langchain.schema import Document
from langchain_huggingface import HuggingFaceEmbeddings
from models.schemas import ChunkInfo, ChunksResponse, DocumentInfo
from config import settings
import logging
from langchain_chroma import Chroma
import chromadb

logger = logging.getLogger(__name__)


class VectorStoreService:
    def __init__(self):
        self.instance_id = id(self)
        self.embeddings = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2"
        )
        self.vector_store = None
        self.client = None
        self._initialized = False
        logger.info(f"VectorStoreService instance created: {self.instance_id}")
    
    async def initialize(self): 
        """Initialize ChromaDB vector store"""
        
        try:
            logger.info(f"Initializing instance: {self.instance_id}")
       
            # Create persist directory if it doesn't exist
            os.makedirs(settings.chroma_persist_directory, exist_ok=True)
            logger.info(f"Chroma persist directory: {settings.chroma_persist_directory}")
            
            
            # Initialize ChromaDB client
            self.client = chromadb.PersistentClient(path=settings.chroma_persist_directory)
          
            
            # Initialize Chroma vector store
            self.vector_store = Chroma(
                client=self.client,
                collection_name="documents",
                embedding_function=self.embeddings,
                persist_directory=settings.chroma_persist_directory
            )
            
            # Test the vector store
            try:
                # Try to get collection info
                collection = self.client.get_collection("documents")
                logger.info(f"Collection count: {collection.count()}")
            except Exception as collection_error:
                logger.error(f"Error accessing collection: {collection_error}")
            
            self._initialized = True
            
            
            
        except Exception as e:
            logger.error(f"Error initializing vector store: {str(e)}")
            logger.error(f"Exception type: {type(e)}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            raise
    
    def add_documents(self, documents: List[Document], document_id: str) -> None:
        """Add documents to the vector store"""
        logger.info(f"add_documents called on instance: {self.instance_id}")
        try:
            if not self.vector_store:
                logger.error(f"Vector store not initialized on instance: {self.instance_id}")
                raise Exception("Vector store not initialized")
            
            # Add document_id to metadata
            for doc in documents:
                doc.metadata["document_id"] = document_id
        
            
            # Add documents to vector store
            self.vector_store.add_documents(documents)
            
            logger.info(f"Added {len(documents)} documents to vector store")
            
        except Exception as e:
            logger.error(f"Error adding documents to vector store: {str(e)}")
            raise
    
    def similarity_search(self, query: str, k: int = None) -> List[Tuple[Document, float]]:
        """Search for similar documents"""
        try:
            if not self.vector_store:
                raise Exception("Vector store not initialized")
            
            k = int(k or settings.max_retrieval_documents)
            
            # Perform similarity search with scores
            results = self.vector_store.similarity_search_with_score(query, k=k)
            
            # Filter by similarity threshold
            filtered_results = [
                (doc, score) for doc, score in results 
                if score >= settings.similarity_threshold
            ]
            
            return filtered_results
            
        except Exception as e:
            logger.error(f"Error performing similarity search: {str(e)}")
            raise
    
    def delete_document(self, document_id: str) -> None:
        """Delete documents from vector store"""
        try:
            if not self.vector_store:
                raise Exception("Vector store not initialized")
            
            # Get collection
            collection = self.client.get_collection("documents")
            
            # Delete documents with matching document_id
            collection.delete(where={"document_id": document_id})
            
            logger.info(f"Deleted documents with document_id: {document_id}")
            
        except Exception as e:
            logger.error(f"Error deleting documents: {str(e)}")
            raise
    
    def get_document_count(self) -> int:
        """Get total number of documents in vector store"""
        try:
            if not self.vector_store:
                raise Exception("Vector store not initialized")
            
            # Get collection
            collection = self.client.get_collection("documents")
            
            # Get all documents
            results = collection.get()
            
            # Group by document_id and filename
            documents_map = {}
            for i, metadata in enumerate(results['metadatas']):
                filename = metadata.get('filename', 'Unknown')
                document_id = metadata.get('document_id', 'unknown')
                upload_date = metadata.get('upload_date', datetime.now().isoformat())
                
                key = f"{document_id}_{filename}"
                
                if key not in documents_map:
                    documents_map[key] = {
                        'filename': filename,
                        'upload_date': upload_date,
                        'chunks_count': 0,
                        'status': 'processed',
                        'id': document_id
                    }
                
                documents_map[key]['chunks_count'] += 1

            documents = [
                DocumentInfo(
                    id=info['id'],
                    filename=info['filename'],
                    upload_date=datetime.fromisoformat(info['upload_date']),
                    chunks_count=info['chunks_count'],
                    status=info['status']
                )
                for info in documents_map.values()
            ]
            
            return documents
            
        except Exception as e:
            logger.error(f"Error getting documents info: {str(e)}")
            raise 
        
    async def get_documents_info(self) -> List[DocumentInfo]:
        """Get information about all processed documents"""
        try:
            if not self.vector_store:
                raise Exception("Vector store not initialized")
            
            # Get collection
            collection = self.client.get_collection("documents")
            
            # Get all documents
            results = collection.get()
            
            # Group by document_id and filename
            documents_map = {}
            
            for i, metadata in enumerate(results['metadatas']):
                filename = metadata.get('filename', 'Unknown')
                document_id = metadata.get('document_id', 'unknown')
                upload_date = metadata.get('upload_date', datetime.now().isoformat())
                
                key = f"{document_id}_{filename}"
                
                if key not in documents_map:
                    documents_map[key] = {
                        'id': document_id,
                        'filename': filename,
                        'upload_date': upload_date,
                        'chunks_count': 0,
                        'status': 'processed'
                    }
                
                documents_map[key]['chunks_count'] += 1
            
            documents = [
                DocumentInfo(
                    id=info['id'],
                    filename=info['filename'],
                    upload_date=datetime.fromisoformat(info['upload_date']),
                    chunks_count=info['chunks_count'],
                    status=info['status']
                )
                for info in documents_map.values()
            ]
            
            return documents
            
        except Exception as e:
            logger.error(f"Error getting documents info: {str(e)}")
            raise

    async def get_chunks(
        self, 
        document_id: Optional[str] = None, 
        page: Optional[int] = None, 
        limit: int = 100
    ) -> ChunksResponse:
        """Get document chunks with optional filtering"""
        try:
            if not self.vector_store:
                raise Exception("Vector store not initialized")
            
            # Get collection
            collection = self.client.get_collection("documents")
            
            # Build where clause
            where_clause = {}
            if document_id:
                where_clause["document_id"] = document_id
            if page is not None:
                where_clause["page"] = page
            
            # Get documents
            if where_clause:
                results = collection.get(where=where_clause, limit=limit)
            else:
                results = collection.get(limit=limit)
            
            # Convert to ChunkInfo objects
            chunks = []
            for i, (chunk_id, metadata) in enumerate(zip(results['ids'], results['metadatas'])):
                content = results['documents'][i] if i < len(results['documents']) else ""
                
                chunks.append(ChunkInfo(
                    id=chunk_id,
                    content=content,
                    page=metadata.get('page', 0),
                    metadata=metadata
                ))
            
            return ChunksResponse(
                chunks=chunks,
                total_count=len(chunks)
            )
            
        except Exception as e:
            logger.error(f"Error getting chunks: {str(e)}")
            raise
    
    def get_document_count(self) -> int:
        """Get total number of documents in vector store"""
        try:
            if not self.vector_store:
                return 0
            
            collection = self.client.get_collection("documents")
            return collection.count()
            
        except Exception as e:
            logger.error(f"Error getting document count: {str(e)}")
            return 0
        

vector_store_instance = VectorStoreService()