"""Authentication schemas."""

import re
from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter (A-Z)")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter (a-z)")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one number (0-9)")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>\-_=+/\\~`]", v):
            raise ValueError("Password must contain at least one special character (!@#$%^&*...)")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class TokenResponse(BaseModel):
    success: bool = True
    data: dict

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": {
                    "access_token": "eyJ...",
                    "token_type": "bearer",
                    "user_id": "uuid",
                },
            }
        }


class UserResponse(BaseModel):
    id: str
    email: str
