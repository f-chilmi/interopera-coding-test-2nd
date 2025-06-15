from typing import List, Dict, Any, Tuple
import re
import logging

logger = logging.getLogger(__name__)

class HighlightingService:
    def __init__(self):
        pass
    
    def highlight_relevant_chunks(
        self, 
        query: str, 
        documents: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Add highlighting information to relevant document chunks"""
        try:
            # Extract key terms from query
            key_terms = self._extract_key_terms(query)
            
            highlighted_docs = []
            for doc in documents:
                content = doc.get('content', '')
                highlighted_content, highlights = self._highlight_text(content, key_terms)
                
                highlighted_doc = {
                    **doc,
                    'highlighted_content': highlighted_content,
                    'highlights': highlights,
                    'highlight_count': len(highlights)
                }
                
                highlighted_docs.append(highlighted_doc)
            
            return highlighted_docs
            
        except Exception as e:
            logger.error(f"Error highlighting chunks: {str(e)}")
            return documents
    
    def _extract_key_terms(self, query: str) -> List[str]:
        """Extract key terms from query for highlighting"""
        # Remove common stop words
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
            'could', 'can', 'may', 'might', 'must', 'what', 'where', 'when', 'why',
            'how', 'which', 'who', 'whom', 'whose'
        }
        
        # Extract words and filter
        words = re.findall(r'\b\w+\b', query.lower())
        key_terms = [word for word in words if word not in stop_words and len(word) > 2]
        
        return key_terms
    
    def _highlight_text(self, text: str, key_terms: List[str]) -> Tuple[str, List[Dict]]:
        """Highlight key terms in text"""
        highlights = []
        highlighted_text = text
        
        for term in key_terms:
            pattern = re.compile(re.escape(term), re.IGNORECASE)
            matches = list(pattern.finditer(text))
            
            for match in matches:
                highlights.append({
                    'term': term,
                    'start': match.start(),
                    'end': match.end(),
                    'matched_text': match.group()
                })
            
            # Add HTML highlighting
            highlighted_text = pattern.sub(f'<mark>{term}</mark>', highlighted_text)
        
        return highlighted_text, highlights
