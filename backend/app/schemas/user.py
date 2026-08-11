from typing import Optional
from pydantic import BaseModel, EmailStr, Field, model_validator


class UserBase(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: EmailStr

    @model_validator(mode="after")
    def validate_name_fields(self):
        if not self.username and not self.name:
            raise ValueError("Either 'username' or 'name' must be provided.")
        if not self.username:
            self.username = self.name
        if not self.name:
            self.name = self.username
        return self


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserResponse(BaseModel):
    id: str
    username: str
    name: str
    email: EmailStr
    created_at: Optional[str] = None

    class Config:
        from_attributes = True
