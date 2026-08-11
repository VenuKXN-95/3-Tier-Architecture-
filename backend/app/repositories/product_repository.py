from datetime import datetime, timezone
from typing import List, Optional
from bson import ObjectId
from app.database.mongodb import get_database


class ProductRepository:
    @property
    def db(self):
        return get_database()

    def create(self, product_data: dict) -> dict:
        stock = product_data.pop("stock", 0)
        now_iso = datetime.now(timezone.utc).isoformat()
        if "created_at" not in product_data:
            product_data["created_at"] = now_iso
        if "updated_at" not in product_data:
            product_data["updated_at"] = now_iso

        result = self.db.products.insert_one(product_data)
        prod_id = str(result.inserted_id)
        product_data["id"] = prod_id

        # Initialize inventory document
        self.db.inventory.update_one(
            {"product_id": prod_id},
            {"$set": {"product_id": prod_id, "quantity": stock}},
            upsert=True,
        )
        product_data["stock"] = stock
        return product_data

    def get_by_id(self, product_id: str) -> Optional[dict]:
        if not ObjectId.is_valid(product_id):
            return None
        doc = self.db.products.find_one({"_id": ObjectId(product_id)})
        if not doc:
            return None
        doc["id"] = str(doc.pop("_id"))
        now_iso = datetime.now(timezone.utc).isoformat()
        doc["created_at"] = doc.get("created_at") or now_iso
        doc["updated_at"] = doc.get("updated_at") or now_iso
        inv = self.db.inventory.find_one({"product_id": doc["id"]})
        doc["stock"] = inv["quantity"] if inv else 0
        return doc

    def list_all(self, category_id: Optional[str] = None) -> List[dict]:
        query = {}
        if category_id:
            query["category_id"] = category_id
        docs = list(self.db.products.find(query))
        now_iso = datetime.now(timezone.utc).isoformat()
        for doc in docs:
            doc["id"] = str(doc.pop("_id"))
            doc["created_at"] = doc.get("created_at") or now_iso
            doc["updated_at"] = doc.get("updated_at") or now_iso
            inv = self.db.inventory.find_one({"product_id": doc["id"]})
            doc["stock"] = inv["quantity"] if inv else 0
        return docs

    def update(self, product_id: str, update_data: dict) -> Optional[dict]:
        if not ObjectId.is_valid(product_id):
            return None
        clean = {k: v for k, v in update_data.items() if v is not None}
        if clean:
            clean["updated_at"] = datetime.now(timezone.utc).isoformat()
            self.db.products.update_one({"_id": ObjectId(product_id)}, {"$set": clean})
        return self.get_by_id(product_id)

    def delete(self, product_id: str) -> bool:
        if not ObjectId.is_valid(product_id):
            return False
        res = self.db.products.delete_one({"_id": ObjectId(product_id)})
        self.db.inventory.delete_one({"product_id": product_id})
        return res.deleted_count > 0
