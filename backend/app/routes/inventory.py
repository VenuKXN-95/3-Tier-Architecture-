from fastapi import APIRouter, HTTPException
from app.schemas.inventory import InventoryResponse, InventoryUpdate
from app.services.inventory_service import InventoryService

router = APIRouter()
service = InventoryService()


@router.get("/{product_id}", response_model=InventoryResponse)
def get_inventory(product_id: str):
    inv = service.get_inventory(product_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory not found")
    return inv


@router.put("/{product_id}", response_model=InventoryResponse)
def update_inventory(product_id: str, inv_in: InventoryUpdate):
    return service.update_inventory(product_id, inv_in.quantity)
