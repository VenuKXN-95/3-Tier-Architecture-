from pydantic import BaseModel, ConfigDict, Field


class InventoryUpdate(BaseModel):
    quantity: int = Field(..., ge=0)


class InventoryResponse(BaseModel):
    product_id: str
    quantity: int

    model_config = ConfigDict(from_attributes=True)
