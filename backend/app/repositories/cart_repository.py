from app.database.mongodb import get_database


class CartRepository:
    @property
    def db(self):
        return get_database()

    def get_by_user_id(self, user_id: str) -> dict:
        cart = self.db.carts.find_one({"user_id": user_id})
        if not cart:
            cart = {"user_id": user_id, "items": []}
        else:
            cart.pop("_id", None)
        return cart

    def add_or_update_item(
        self,
        user_id: str,
        product_id: str,
        quantity: int,
        unit_price: float,
        product_name: str = "",
    ) -> dict:
        cart = self.get_by_user_id(user_id)
        items = cart.get("items", [])
        found = False

        for item in items:
            if item["product_id"] == product_id:
                item["quantity"] += quantity
                item["unit_price"] = unit_price
                item["subtotal"] = item["quantity"] * unit_price
                found = True
                break

        if not found:
            items.append(
                {
                    "product_id": product_id,
                    "product_name": product_name,
                    "quantity": quantity,
                    "unit_price": unit_price,
                    "subtotal": quantity * unit_price,
                }
            )

        self.db.carts.update_one(
            {"user_id": user_id},
            {"$set": {"user_id": user_id, "items": items}},
            upsert=True,
        )
        return self.get_by_user_id(user_id)

    def clear_cart(self, user_id: str) -> dict:
        self.db.carts.update_one(
            {"user_id": user_id},
            {"$set": {"items": []}},
            upsert=True,
        )
        return {"user_id": user_id, "items": []}
