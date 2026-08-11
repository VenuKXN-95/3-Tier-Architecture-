from typing import List, Optional
from app.repositories.user_repository import UserRepository


class UserService:
    def __init__(self, repo: Optional[UserRepository] = None):
        self.repo = repo or UserRepository()

    def create_user(self, user_data: dict) -> dict:
        return self.repo.create(user_data)

    def get_user(self, user_id: str) -> Optional[dict]:
        return self.repo.get_by_id(user_id)

    def list_users(self) -> List[dict]:
        return self.repo.list_all()
