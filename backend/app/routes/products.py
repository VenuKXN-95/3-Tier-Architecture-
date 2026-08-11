from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.services.product_service import ProductService

router = APIRouter()
service = ProductService()


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product_in: ProductCreate):
    return service.create_product(product_in.model_dump())


@router.get("", response_model=List[ProductResponse])
def list_products(category_id: Optional[str] = None):
    return service.list_products(category_id=category_id)


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: str):
    prod = service.get_product(product_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    return prod


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: str, product_in: ProductUpdate):
    prod = service.update_product(product_id, product_in.model_dump(exclude_unset=True))
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    return prod


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: str):
    success = service.delete_product(product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found")
