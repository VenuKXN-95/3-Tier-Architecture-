from typing import List, Optional
from app.core.security import verify_password
from app.repositories.user_repository import UserRepository


class UserService:
    def __init__(self, repo: Optional[UserRepository] = None):
        self.repo = repo or UserRepository()

    def create_user(self, user_data: dict) -> dict:
        existing = self.repo.get_by_email(user_data.get("email", ""))
        if existing:
            raise ValueError("Email already registered")
        return self.repo.create(user_data)

    def authenticate_user(self, email: str, password: str) -> Optional[dict]:
        user = self.repo.get_by_email(email)
        if not user:
            return None
        hashed_password = user.get("password_hash", "")
        if not verify_password(password, hashed_password):
            return None
        user.pop("password_hash", None)
        user.pop("password", None)
        return user

    def get_user(self, user_id: str) -> Optional[dict]:
        return self.repo.get_by_id(user_id)

    def list_users(self) -> List[dict]:
        return self.repo.list_all()
