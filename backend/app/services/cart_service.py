from typing import Optional
from app.repositories.cart_repository import CartRepository
from app.repositories.product_repository import ProductRepository


class CartService:
    def __init__(
        self,
        cart_repo: Optional[CartRepository] = None,
        product_repo: Optional[ProductRepository] = None,
    ):
        self.cart_repo = cart_repo or CartRepository()
        self.product_repo = product_repo or ProductRepository()

    def get_cart(self, user_id: str) -> dict:
        cart = self.cart_repo.get_by_user_id(user_id)
        items = cart.get("items", [])
        total = sum(i.get("subtotal", 0.0) for i in items)
        cart["total_price"] = total
        return cart

    def add_to_cart(self, user_id: str, product_id: str, quantity: int) -> dict:
        product = self.product_repo.get_by_id(product_id)
        unit_price = product.get("price", 0.0) if product else 0.0
        product_name = product.get("name", "") if product else ""

        cart = self.cart_repo.add_or_update_item(
            user_id=user_id,
            product_id=product_id,
            quantity=quantity,
            unit_price=unit_price,
            product_name=product_name,
        )
        items = cart.get("items", [])
        cart["total_price"] = sum(i.get("subtotal", 0.0) for i in items)
        return cart

    def clear_cart(self, user_id: str) -> dict:
        return self.cart_repo.clear_cart(user_id)
