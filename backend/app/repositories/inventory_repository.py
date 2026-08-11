from typing import Optional
from app.database.mongodb import get_database


class InventoryRepository:
    @property
    def db(self):
        return get_database()

    def get_by_product_id(self, product_id: str) -> Optional[dict]:
        doc = self.db.inventory.find_one({"product_id": product_id})
        if doc:
            doc.pop("_id", None)
            return doc
        return {"product_id": product_id, "quantity": 0}

    def update_stock(self, product_id: str, quantity: int) -> dict:
        self.db.inventory.update_one(
            {"product_id": product_id},
            {"$set": {"product_id": product_id, "quantity": quantity}},
            upsert=True,
        )
        return {"product_id": product_id, "quantity": quantity}

    def decrement_stock(self, product_id: str, amount: int) -> bool:
        res = self.db.inventory.update_one(
            {"product_id": product_id, "quantity": {"$gte": amount}},
            {"$inc": {"quantity": -amount}},
        )
        return res.modified_count > 0

    def increment_stock(self, product_id: str, amount: int) -> None:
        self.db.inventory.update_one(
            {"product_id": product_id},
            {"$inc": {"quantity": amount}},
            upsert=True,
        )
