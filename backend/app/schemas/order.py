from typing import List, Optional
from pydantic import BaseModel


class ShippingAddress(BaseModel):
    street: str
    city: str
    state: str
    postal_code: str
    country: str


class OrderItemResponse(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    unit_price: float
    subtotal: float


class OrderCreate(BaseModel):
    user_id: str
    shipping_address: ShippingAddress


class OrderResponse(BaseModel):
    id: str
    user_id: str
    items: List[OrderItemResponse]
    total_amount: float
    shipping_address: ShippingAddress
    status: str = "pending"
    created_at: str
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True
