from typing import List, Optional
from app.repositories.product_repository import ProductRepository


class ProductService:
    def __init__(self, repo: Optional[ProductRepository] = None):
        self.repo = repo or ProductRepository()

    def create_product(self, product_data: dict) -> dict:
        return self.repo.create(product_data)

    def get_product(self, product_id: str) -> Optional[dict]:
        return self.repo.get_by_id(product_id)

    def list_products(self, category_id: Optional[str] = None) -> List[dict]:
        return self.repo.list_all(category_id=category_id)

    def update_product(self, product_id: str, update_data: dict) -> Optional[dict]:
        return self.repo.update(product_id, update_data)

    def delete_product(self, product_id: str) -> bool:
        return self.repo.delete(product_id)
