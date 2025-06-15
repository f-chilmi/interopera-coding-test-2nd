from typing import Dict, Any
import logging
from datetime import datetime
import json
import os

logger = logging.getLogger(__name__)

class EvaluationService:
    def __init__(self):
        self.feedback_file = "feedback_data.json"
        self.load_feedback_data()
    
    def load_feedback_data(self):
        """Load existing feedback data"""
        try:
            if os.path.exists(self.feedback_file):
                with open(self.feedback_file, 'r') as f:
                    self.feedback_data = json.load(f)
            else:
                self.feedback_data = []
        except Exception as e:
            logger.error(f"Error loading feedback data: {str(e)}")
            self.feedback_data = []
    
    def save_feedback(self, feedback: Dict[str, Any]) -> bool:
        """Save user feedback"""
        try:
            feedback_entry = {
                "timestamp": datetime.now().isoformat(),
                "question": feedback.get("question", ""),
                "answer": feedback.get("answer", ""),
                "rating": feedback.get("rating", 0),
                "feedback_text": feedback.get("feedback_text", ""),
                "session_id": feedback.get("session_id", "")
            }
            
            self.feedback_data.append(feedback_entry)
            
            # Save to file
            with open(self.feedback_file, 'w') as f:
                json.dump(self.feedback_data, f, indent=2)
            
            logger.info(f"Feedback saved: rating {feedback_entry['rating']}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving feedback: {str(e)}")
            return False
    
    def get_feedback_stats(self) -> Dict[str, Any]:
        """Get feedback statistics"""
        try:
            if not self.feedback_data:
                return {"total_feedback": 0, "average_rating": 0, "rating_distribution": {}}
            
            ratings = [entry["rating"] for entry in self.feedback_data if entry["rating"] > 0]
            
            stats = {
                "total_feedback": len(self.feedback_data),
                "average_rating": sum(ratings) / len(ratings) if ratings else 0,
                "rating_distribution": {
                    str(i): ratings.count(i) for i in range(1, 6)
                }
            }
            
            return stats
            
        except Exception as e:
            logger.error(f"Error calculating feedback stats: {str(e)}")
            return {"error": str(e)}
