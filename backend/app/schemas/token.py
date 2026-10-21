
from pydantic import BaseModel


class Token(BaseModel):
    """JWT bearer access token response."""

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Claims decoded from JWT payload."""

    user_id: int | None = None
    email: str | None = None
    role: str | None = None
