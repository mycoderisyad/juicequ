"""
Cashier endpoints package.
Handles all kasir/cashier functionality.
"""
from fastapi import APIRouter

from app.api.v1.endpoints.cashier import orders, transactions, reports

router = APIRouter()

router.include_router(orders.router, prefix="/orders", tags=["Cashier - Orders"])
router.include_router(transactions.router, prefix="/transactions", tags=["Cashier - Transactions"])
router.include_router(reports.router, prefix="/reports", tags=["Cashier - Reports"])