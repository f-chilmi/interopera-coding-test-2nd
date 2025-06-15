from typing import Dict, Any, List
import logging
import numpy as np

logger = logging.getLogger(__name__)

class FinancialCalculator:
    def __init__(self):
        pass
    
    def calculate_metrics(self, financial_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate various financial metrics from provided data"""
        try:
            metrics = {}
            
            # Extract basic financial data
            revenue = financial_data.get('revenue', 0)
            net_income = financial_data.get('net_income', 0)
            total_assets = financial_data.get('total_assets', 0)
            total_liabilities = financial_data.get('total_liabilities', 0)
            shareholders_equity = financial_data.get('shareholders_equity', 0)
            current_assets = financial_data.get('current_assets', 0)
            current_liabilities = financial_data.get('current_liabilities', 0)
            
            # Profitability Ratios
            if revenue > 0:
                metrics['net_profit_margin'] = (net_income / revenue) * 100
            
            if total_assets > 0:
                metrics['return_on_assets'] = (net_income / total_assets) * 100
            
            if shareholders_equity > 0:
                metrics['return_on_equity'] = (net_income / shareholders_equity) * 100
            
            # Liquidity Ratios
            if current_liabilities > 0:
                metrics['current_ratio'] = current_assets / current_liabilities
            
            # Leverage Ratios
            if total_assets > 0:
                metrics['debt_to_assets'] = (total_liabilities / total_assets) * 100
            
            if shareholders_equity > 0:
                metrics['debt_to_equity'] = total_liabilities / shareholders_equity
            
            # Additional calculations
            metrics['total_equity'] = total_assets - total_liabilities
            metrics['working_capital'] = current_assets - current_liabilities
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error calculating financial metrics: {str(e)}")
            raise
