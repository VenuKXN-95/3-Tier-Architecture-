from typing import List
from fastapi import APIRouter, HTTPException, status
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from app.services.category_service import CategoryService

router = APIRouter()
service = CategoryService()


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(category_in: CategoryCreate):
    return service.create_category(category_in.model_dump())


@router.get("", response_model=List[CategoryResponse])
def list_categories():
    return service.list_categories()


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(category_id: str):
    cat = service.get_category(category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(category_id: str, category_in: CategoryUpdate):
    cat = service.update_category(
        category_id, category_in.model_dump(exclude_unset=True)
    )
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: str):
    success = service.delete_category(category_id)
    if not success:
        raise HTTPException(status_code=404, detail="Category not found")
