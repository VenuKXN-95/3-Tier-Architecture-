from datetime import datetime, timezone
from typing import List, Optional
from bson import ObjectId
from app.core.security import hash_password
from app.database.mongodb import get_database


class UserRepository:
    @property
    def db(self):
        return get_database()

    def create(self, user_data: dict) -> dict:
        username = user_data.get("username") or user_data.get("name", "")
        name = user_data.get("name") or username
        user_data["username"] = username
        user_data["name"] = name
        if "created_at" not in user_data:
            user_data["created_at"] = datetime.now(timezone.utc).isoformat()

        # Hash plain text password and remove plain text field
        raw_password = user_data.pop("password", None)
        if raw_password:
            user_data["password_hash"] = hash_password(raw_password)

        res = self.db.users.insert_one(user_data)
        user_data["id"] = str(res.inserted_id)
        user_data.pop("_id", None)
        user_data.pop("password_hash", None)
        return user_data

    def get_by_id(self, user_id: str) -> Optional[dict]:
        if not ObjectId.is_valid(user_id):
            return None
        doc = self.db.users.find_one({"_id": ObjectId(user_id)})
        if doc:
            doc["id"] = str(doc.pop("_id"))
            username = doc.get("username") or doc.get("name", "")
            doc["username"] = username
            doc["name"] = doc.get("name") or username
            now_iso = datetime.now(timezone.utc).isoformat()
            doc["created_at"] = doc.get("created_at") or now_iso
            doc.pop("password_hash", None)
            doc.pop("password", None)
        return doc

    def get_by_email(self, email: str) -> Optional[dict]:
        doc = self.db.users.find_one({"email": email})
        if doc:
            doc["id"] = str(doc.pop("_id"))
            username = doc.get("username") or doc.get("name", "")
            doc["username"] = username
            doc["name"] = doc.get("name") or username
        return doc

    def list_all(self) -> List[dict]:
        docs = list(self.db.users.find())
        now_iso = datetime.now(timezone.utc).isoformat()
        for doc in docs:
            doc["id"] = str(doc.pop("_id"))
            username = doc.get("username") or doc.get("name", "")
            doc["username"] = username
            doc["name"] = doc.get("name") or username
            doc["created_at"] = doc.get("created_at") or now_iso
            doc.pop("password_hash", None)
            doc.pop("password", None)
        return docs
