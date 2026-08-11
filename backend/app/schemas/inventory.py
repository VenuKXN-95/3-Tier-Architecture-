from pydantic import BaseModel, Field


class InventoryUpdate(BaseModel):
    quantity: int = Field(..., ge=0)


class InventoryResponse(BaseModel):
    product_id: str
    quantity: int

    class Config:
        from_attributes = True
