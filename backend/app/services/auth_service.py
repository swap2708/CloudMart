
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.schemas.user import UserCreate
from app.utils.security import get_password_hash, verify_password


class AuthService:
    """Service handling user registration, authentication, and retrieval."""

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> User | None:
        """Fetch user by unique email address."""
        return db.query(User).filter(User.email == email.lower().strip()).first()

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> User | None:
        """Fetch user by primary key id."""
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> User | None:
        """Authenticate user by email and plaintext password."""
        user = AuthService.get_user_by_email(db, email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    @staticmethod
    def register_user(
        db: Session,
        user_in: UserCreate,
        role: UserRole = UserRole.CUSTOMER,
    ) -> User:
        """Register a new user account with hashed password."""
        normalized_email = user_in.email.lower().strip()
        existing_user = AuthService.get_user_by_email(db, normalized_email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists",
            )

        hashed_password = get_password_hash(user_in.password)
        db_user = User(
            email=normalized_email,
            hashed_password=hashed_password,
            full_name=user_in.full_name.strip(),
            role=role,
            is_active=True,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user


auth_service = AuthService()
