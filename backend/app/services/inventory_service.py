from typing import Optional
from app.repositories.inventory_repository import InventoryRepository


class InventoryService:
    def __init__(self, repo: Optional[InventoryRepository] = None):
        self.repo = repo or InventoryRepository()

    def get_inventory(self, product_id: str) -> Optional[dict]:
        return self.repo.get_by_product_id(product_id)

    def update_inventory(self, product_id: str, quantity: int) -> dict:
        return self.repo.update_stock(product_id, quantity)
