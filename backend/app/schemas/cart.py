from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class CartItemAdd(BaseModel):
    product_id: str
    quantity: int = Field(..., gt=0)


class CartItemResponse(BaseModel):
    product_id: str
    product_name: Optional[str] = None
    quantity: int
    unit_price: float
    subtotal: float


class CartResponse(BaseModel):
    user_id: str
    items: List[CartItemResponse] = []
    total_price: float = 0.0

    model_config = ConfigDict(from_attributes=True)
