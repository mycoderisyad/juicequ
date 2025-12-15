"""Pagination helper utilities."""
from typing import Any, Sequence


def calculate_total_pages(total: int, page_size: int) -> int:
    """Calculate total number of pages."""
    if total <= 0 or page_size <= 0:
        return 0
    return (total + page_size - 1) // page_size


def paginate_response(
    items: Sequence[Any],
    total: int,
    page: int,
    page_size: int,
    items_key: str = "items",
) -> dict[str, Any]:
    """
    Create a standardized pagination response.

    Args:
        items: List of items for current page
        total: Total count of all items
        page: Current page number
        page_size: Items per page
        items_key: Key name for items in response

    Returns:
        Pagination response dict
    """
    return {
        items_key: items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": calculate_total_pages(total, page_size),
    }

