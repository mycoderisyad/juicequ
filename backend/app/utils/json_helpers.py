"""Safe JSON parsing utilities."""
import json
from typing import Any, TypeVar

T = TypeVar("T")


def safe_json_loads(value: str | None, default: T = None) -> T | Any:
    """
    Safely parse JSON string, returning default on failure.

    Args:
        value: JSON string to parse, or None
        default: Default value if parsing fails

    Returns:
        Parsed JSON or default value
    """
    if not value:
        return default
    try:
        result = json.loads(value)
        return result if result is not None else default
    except (json.JSONDecodeError, TypeError, ValueError):
        return default


def safe_json_dumps(value: Any) -> str | None:
    """
    Safely serialize value to JSON string.

    Args:
        value: Value to serialize

    Returns:
        JSON string or None if value is None/empty
    """
    if value is None:
        return None
    if isinstance(value, (list, dict)) and not value:
        return None
    try:
        return json.dumps(value)
    except (TypeError, ValueError):
        return None

