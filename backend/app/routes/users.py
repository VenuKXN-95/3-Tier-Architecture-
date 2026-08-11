from typing import List
from fastapi import APIRouter, HTTPException, status
from app.schemas.user import UserCreate, UserResponse
from app.services.user_service import UserService

router = APIRouter()
service = UserService()


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user_in: UserCreate):
    return service.create_user(user_in.model_dump())


@router.get("", response_model=List[UserResponse])
def list_users():
    return service.list_users()


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: str):
    user = service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
