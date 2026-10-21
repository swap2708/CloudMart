import re
from datetime import datetime
from typing import Annotated, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.models.user import UserRole

EMAIL_PATTERN = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"


class UserBase(BaseModel):
    """Shared user properties."""

    email: Annotated[str, Field(pattern=EMAIL_PATTERN, max_length=255)]
    full_name: str = Field(..., min_length=1, max_length=255)


class UserCreate(UserBase):
    """Request payload to register a new user."""

    password: str = Field(..., min_length=6, max_length=128)


class UserLogin(BaseModel):
    """Request payload for user authentication."""

    email: Annotated[str, Field(pattern=EMAIL_PATTERN, max_length=255)]
    password: str


class UserUpdate(BaseModel):
    """Request payload for profile updates."""

    full_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    password: Optional[str] = Field(default=None, min_length=6, max_length=128)


class UserResponse(UserBase):
    """Public user response schema excluding password hash."""

    id: int
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
