from typing import List, Optional
from app.repositories.cart_repository import CartRepository
from app.repositories.order_repository import OrderRepository


class OrderService:
    def __init__(
        self,
        order_repo: Optional[OrderRepository] = None,
        cart_repo: Optional[CartRepository] = None,
    ):
        self.order_repo = order_repo or OrderRepository()
        self.cart_repo = cart_repo or CartRepository()

    def create_order(self, user_id: str, shipping_address: dict) -> dict:
        cart = self.cart_repo.get_by_user_id(user_id)
        cart_items = cart.get("items", [])

        order = self.order_repo.create_order(
            user_id=user_id,
            shipping_address=shipping_address,
            cart_items=cart_items,
        )
        self.cart_repo.clear_cart(user_id)
        return order

    def get_order(self, order_id: str) -> Optional[dict]:
        return self.order_repo.get_by_id(order_id)

    def list_orders(self, user_id: Optional[str] = None) -> List[dict]:
        if user_id:
            return self.order_repo.list_by_user(user_id)
        return self.order_repo.list_all()
