from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User, UserRole
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserResponse
from app.services.auth_service import auth_service
from app.utils.security import create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new customer account",
)
def register(user_in: UserCreate, db: Session = Depends(get_db)) -> UserResponse:
    """Register a new customer account with email and password."""
    return auth_service.register_user(db, user_in, role=UserRole.CUSTOMER)


@router.post(
    "/login",
    response_model=Token,
    summary="Authenticate user and return JWT access token",
)
async def login(
    request: Request,
    db: Session = Depends(get_db),
) -> Token:
    """Authenticate user with credentials.

    Supports both application/x-www-form-urlencoded (OAuth2 / Swagger UI)
    and application/json payloads.
    """
    email = None
    password = None

    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            body = await request.json()
            email = body.get("email") or body.get("username")
            password = body.get("password")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON payload",
            )
    else:
        form = await request.form()
        email = form.get("username") or form.get("email")
        password = form.get("password")

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required",
        )

    user = auth_service.authenticate_user(db, str(email), str(password))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )

    access_token = create_access_token(
        data={
            "sub": user.email,
            "user_id": user.id,
            "role": user.role.value,
        }
    )

    return Token(access_token=access_token, token_type="bearer")


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user profile",
)
def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Retrieve the profile data of the currently authenticated user."""
    return current_user
