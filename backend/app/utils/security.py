from datetime import UTC, datetime, timedelta
from typing import Any

# Passlib 1.7.4 compatibility patch for bcrypt >= 4.0.0
try:
    import bcrypt

    if not hasattr(bcrypt, "__about__"):
        bcrypt.__about__ = type(
            "about",
            (),
            {"__version__": getattr(bcrypt, "__version__", "4.0.0")},
        )
    _orig_hashpw = bcrypt.hashpw

    def _safe_hashpw(password: bytes, salt: bytes) -> bytes:
        if len(password) > 72:
            password = password[:72]
        return _orig_hashpw(password, salt)

    bcrypt.hashpw = _safe_hashpw
except ImportError:
    pass

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

# Passlib CryptContext using bcrypt hashing scheme
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify that a plaintext password matches the bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate a secure bcrypt hash for a plaintext password."""
    return pwd_context.hash(password)


def create_access_token(
    data: dict[str, Any],
    expires_delta: timedelta | None = None,
) -> str:
    """Generate a signed JWT access token with an expiration time."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        )

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    return encoded_jwt


def decode_access_token(token: str) -> dict[str, Any] | None:
    """Decode and validate a signed JWT access token.

    Returns payload dict or None if invalid or expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return payload
    except JWTError:
        return None
