"""
Common generic schemas used across multiple endpoints.
"""

from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic response wrapper for paginated lists."""

    items: list[T]
    total: int
    page: int
    page_size: int
    pages: int
