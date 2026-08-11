from typing import List, Optional
from bson import ObjectId
from app.database.mongodb import get_database


class CategoryRepository:
    def __init__(self):
        self._db = None

    @property
    def db(self):
        return get_database()

    def create(self, category_data: dict) -> dict:
        result = self.db.categories.insert_one(category_data)
        category_data["id"] = str(result.inserted_id)
        return category_data

    def get_by_id(self, category_id: str) -> Optional[dict]:
        if not ObjectId.is_valid(category_id):
            return None
        doc = self.db.categories.find_one({"_id": ObjectId(category_id)})
        if doc:
            doc["id"] = str(doc.pop("_id"))
        return doc

    def list_all(self) -> List[dict]:
        docs = list(self.db.categories.find())
        for doc in docs:
            doc["id"] = str(doc.pop("_id"))
        return docs

    def update(self, category_id: str, update_data: dict) -> Optional[dict]:
        if not ObjectId.is_valid(category_id):
            return None
        clean_update = {k: v for k, v in update_data.items() if v is not None}
        if not clean_update:
            return self.get_by_id(category_id)
        self.db.categories.update_one(
            {"_id": ObjectId(category_id)}, {"$set": clean_update}
        )
        return self.get_by_id(category_id)

    def delete(self, category_id: str) -> bool:
        if not ObjectId.is_valid(category_id):
            return False
        res = self.db.categories.delete_one({"_id": ObjectId(category_id)})
        return res.deleted_count > 0
