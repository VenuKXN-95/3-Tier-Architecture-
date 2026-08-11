from typing import List, Optional
from bson import ObjectId
from app.database.mongodb import get_database


class ProductRepository:
    @property
    def db(self):
        return get_database()

    def create(self, product_data: dict) -> dict:
        stock = product_data.pop("stock", 0)
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
        inv = self.db.inventory.find_one({"product_id": doc["id"]})
        doc["stock"] = inv["quantity"] if inv else 0
        return doc

    def list_all(self, category_id: Optional[str] = None) -> List[dict]:
        query = {}
        if category_id:
            query["category_id"] = category_id
        docs = list(self.db.products.find(query))
        for doc in docs:
            doc["id"] = str(doc.pop("_id"))
            inv = self.db.inventory.find_one({"product_id": doc["id"]})
            doc["stock"] = inv["quantity"] if inv else 0
        return docs

    def update(self, product_id: str, update_data: dict) -> Optional[dict]:
        if not ObjectId.is_valid(product_id):
            return None
        clean = {k: v for k, v in update_data.items() if v is not None}
        if clean:
            self.db.products.update_one({"_id": ObjectId(product_id)}, {"$set": clean})
        return self.get_by_id(product_id)

    def delete(self, product_id: str) -> bool:
        if not ObjectId.is_valid(product_id):
            return False
        res = self.db.products.delete_one({"_id": ObjectId(product_id)})
        self.db.inventory.delete_one({"product_id": product_id})
        return res.deleted_count > 0
