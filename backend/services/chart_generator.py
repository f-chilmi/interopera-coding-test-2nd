from typing import Dict, Any, List
import logging
import json
import base64
from io import BytesIO
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd

logger = logging.getLogger(__name__)

class ChartGenerator:
    def __init__(self):
        # Set up matplotlib for better charts
        plt.style.use('seaborn-v0_8')
        sns.set_palette("husl")
    
    def generate_chart(self, chart_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate various types of financial charts"""
        try:
            chart_type = chart_data.get('type', 'bar')
            data = chart_data.get('data', {})
            title = chart_data.get('title', 'Financial Chart')
            
            # Create figure
            fig, ax = plt.subplots(figsize=(10, 6))
            
            if chart_type == 'bar':
                self._create_bar_chart(ax, data, title)
            elif chart_type == 'line':
                self._create_line_chart(ax, data, title)
            elif chart_type == 'pie':
                self._create_pie_chart(ax, data, title)
            elif chart_type == 'financial_metrics':
                self._create_metrics_chart(ax, data, title)
            else:
                self._create_bar_chart(ax, data, title)
            
            # Convert to base64
            buffer = BytesIO()
            plt.savefig(buffer, format='png', dpi=300, bbox_inches='tight')
            buffer.seek(0)
            
            chart_base64 = base64.b64encode(buffer.getvalue()).decode()
            plt.close(fig)
            
            return {
                'chart': chart_base64,
                'type': chart_type,
                'title': title
            }
            
        except Exception as e:
            logger.error(f"Error generating chart: {str(e)}")
            raise
    
    def _create_bar_chart(self, ax, data: Dict, title: str):
        """Create bar chart"""
        labels = list(data.keys())
        values = list(data.values())
        
        bars = ax.bar(labels, values)
        ax.set_title(title, fontsize=14, fontweight='bold')
        ax.set_ylabel('Value')
        
        # Add value labels on bars
        for bar in bars:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height,
                   f'{height:.2f}', ha='center', va='bottom')
        
        ax.tick_params(axis='x', rotation=45)
    
    def _create_line_chart(self, ax, data: Dict, title: str):
        """Create line chart"""
        if isinstance(data, dict):
            for label, values in data.items():
                if isinstance(values, list):
                    ax.plot(range(len(values)), values, marker='o', label=label)
        
        ax.set_title(title, fontsize=14, fontweight='bold')
        ax.set_ylabel('Value')
        ax.set_xlabel('Period')
        ax.legend()
        ax.grid(True, alpha=0.3)
    
    def _create_pie_chart(self, ax, data: Dict, title: str):
        """Create pie chart"""
        labels = list(data.keys())
        sizes = list(data.values())
        
        ax.pie(sizes, labels=labels, autopct='%1.1f%%', startangle=90)
        ax.set_title(title, fontsize=14, fontweight='bold')
    
    def _create_metrics_chart(self, ax, data: Dict, title: str):
        """Create financial metrics comparison chart"""
        metrics = list(data.keys())
        values = list(data.values())
        
        colors = plt.cm.Set3(range(len(metrics)))
        bars = ax.barh(metrics, values, color=colors)
        
        ax.set_title(title, fontsize=14, fontweight='bold')
        ax.set_xlabel('Value (%)')
        
        # Add value labels
        for i, (bar, value) in enumerate(zip(bars, values)):
            ax.text(value + 0.1, bar.get_y() + bar.get_height()/2,
                   f'{value:.2f}%', va='center')
