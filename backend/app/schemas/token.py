from typing import Optional
from pydantic import BaseModel


class Token(BaseModel):
    """JWT bearer access token response."""

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Claims decoded from JWT payload."""

    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None
