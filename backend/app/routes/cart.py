from fastapi import APIRouter
from app.schemas.cart import CartItemAdd, CartResponse
from app.services.cart_service import CartService

router = APIRouter()
service = CartService()


@router.get("/{user_id}", response_model=CartResponse)
def get_cart(user_id: str):
    return service.get_cart(user_id)


@router.post("/{user_id}/items", response_model=CartResponse)
def add_to_cart(user_id: str, item_in: CartItemAdd):
    return service.add_to_cart(user_id, item_in.product_id, item_in.quantity)


@router.delete("/{user_id}", response_model=CartResponse)
def clear_cart(user_id: str):
    return service.clear_cart(user_id)
