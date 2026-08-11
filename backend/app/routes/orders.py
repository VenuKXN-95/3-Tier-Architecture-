from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from app.schemas.order import OrderCreate, OrderResponse
from app.services.order_service import OrderService

router = APIRouter()
user_orders_router = APIRouter()
service = OrderService()


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_in: OrderCreate):
    return service.create_order(
        order_in.user_id, order_in.shipping_address.model_dump()
    )


@router.get("", response_model=List[OrderResponse])
def list_orders(user_id: Optional[str] = None):
    return service.list_orders(user_id=user_id)


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: str):
    order = service.get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post(
    "/{user_id}", response_model=OrderResponse, status_code=status.HTTP_201_CREATED
)
def create_order_by_user_id(user_id: str):
    default_address = {
        "street": "123 Main St",
        "city": "Tech City",
        "state": "CA",
        "postal_code": "90001",
        "country": "USA",
    }
    return service.create_order(user_id, default_address)


@router.post("/{order_id}/cancel", response_model=OrderResponse)
def cancel_order(order_id: str):
    order = service.cancel_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@user_orders_router.get("/{user_id}/orders", response_model=List[OrderResponse])
def get_user_orders(user_id: str):
    return service.list_orders(user_id=user_id)
