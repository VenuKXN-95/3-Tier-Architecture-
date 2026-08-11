from typing import List
from fastapi import APIRouter, HTTPException, status
from app.core.security import create_access_token
from app.schemas.user import TokenResponse, UserCreate, UserLogin, UserResponse
from app.services.user_service import UserService

router = APIRouter()
service = UserService()


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user_in: UserCreate):
    try:
        return service.create_user(user_in.model_dump())
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc


@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin):
    user = service.authenticate_user(credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    access_token = create_access_token(
        data={"sub": user["id"], "email": user["email"]}
    )
    return TokenResponse(access_token=access_token, token_type="bearer", user=user)


@router.get("", response_model=List[UserResponse])
def list_users():
    return service.list_users()


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: str):
    user = service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
