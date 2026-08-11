from typing import List, Optional
from app.repositories.cart_repository import CartRepository
from app.repositories.inventory_repository import InventoryRepository
from app.repositories.order_repository import OrderRepository


class OrderService:
    def __init__(
        self,
        order_repo: Optional[OrderRepository] = None,
        cart_repo: Optional[CartRepository] = None,
        inventory_repo: Optional[InventoryRepository] = None,
    ):
        self.order_repo = order_repo or OrderRepository()
        self.cart_repo = cart_repo or CartRepository()
        self.inventory_repo = inventory_repo or InventoryRepository()

    def create_order(self, user_id: str, shipping_address: dict) -> dict:
        cart = self.cart_repo.get_by_user_id(user_id)
        cart_items = cart.get("items", [])

        order = self.order_repo.create_order(
            user_id=user_id,
            shipping_address=shipping_address,
            cart_items=cart_items,
        )
        for item in cart_items:
            prod_id = item.get("product_id")
            qty = item.get("quantity", 0)
            if prod_id and qty > 0:
                self.inventory_repo.decrement_stock(prod_id, qty)

        self.cart_repo.clear_cart(user_id)
        return order

    def get_order(self, order_id: str) -> Optional[dict]:
        return self.order_repo.get_by_id(order_id)

    def list_orders(self, user_id: Optional[str] = None) -> List[dict]:
        if user_id:
            return self.order_repo.list_by_user(user_id)
        return self.order_repo.list_all()

    def cancel_order(self, order_id: str) -> Optional[dict]:
        existing = self.order_repo.get_by_id(order_id)
        if existing and existing.get("status") != "CANCELLED":
            for item in existing.get("items", []):
                prod_id = item.get("product_id")
                qty = item.get("quantity", 0)
                if prod_id and qty > 0:
                    self.inventory_repo.increment_stock(prod_id, qty)
        return self.order_repo.cancel_order(order_id)
