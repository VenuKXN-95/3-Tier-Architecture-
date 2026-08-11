from typing import List, Optional
from app.repositories.category_repository import CategoryRepository


class CategoryService:
    def __init__(self, repo: Optional[CategoryRepository] = None):
        self.repo = repo or CategoryRepository()

    def create_category(self, category_data: dict) -> dict:
        return self.repo.create(category_data)

    def get_category(self, category_id: str) -> Optional[dict]:
        return self.repo.get_by_id(category_id)

    def list_categories(self) -> List[dict]:
        return self.repo.list_all()

    def update_category(self, category_id: str, update_data: dict) -> Optional[dict]:
        return self.repo.update(category_id, update_data)

    def delete_category(self, category_id: str) -> bool:
        return self.repo.delete(category_id)
