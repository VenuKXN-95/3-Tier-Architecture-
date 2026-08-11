from datetime import datetime, timezone
from typing import List, Optional
from bson import ObjectId
from app.database.mongodb import get_database


class OrderRepository:
    @property
    def db(self):
        return get_database()

    def create_order(
        self, user_id: str, shipping_address: dict, cart_items: List[dict]
    ) -> dict:
        total_amount = sum(item.get("subtotal", 0.0) for item in cart_items)
        now_iso = datetime.now(timezone.utc).isoformat()

        order_doc = {
            "user_id": user_id,
            "items": cart_items,
            "total_amount": total_amount,
            "shipping_address": shipping_address,
            "status": "pending",
            "created_at": now_iso,
        }

        res = self.db.orders.insert_one(order_doc)
        order_doc["id"] = str(res.inserted_id)
        order_doc.pop("_id", None)
        return order_doc

    def get_by_id(self, order_id: str) -> Optional[dict]:
        if not ObjectId.is_valid(order_id):
            return None
        doc = self.db.orders.find_one({"_id": ObjectId(order_id)})
        if doc:
            doc["id"] = str(doc.pop("_id"))
        return doc

    def list_by_user(self, user_id: str) -> List[dict]:
        docs = list(self.db.orders.find({"user_id": user_id}))
        for doc in docs:
            doc["id"] = str(doc.pop("_id"))
        return docs

    def list_all(self) -> List[dict]:
        docs = list(self.db.orders.find())
        for doc in docs:
            doc["id"] = str(doc.pop("_id"))
        return docs
