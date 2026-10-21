from collections.abc import Generator
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models.inventory import Inventory
from app.models.product import Product
from app.models.user import User, UserRole
from app.utils.security import create_access_token, get_password_hash

# In-memory SQLite for fast, isolated testing
SQLITE_TEST_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLITE_TEST_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db() -> Generator[Session, None, None]:
    """Provide an isolated database session for each test function."""
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db: Session) -> Generator[TestClient, None, None]:
    """Test client with get_db overridden to use the isolated test database."""
    def override_get_db() -> Generator[Session, None, None]:
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db: Session) -> User:
    """Create a test admin user fixture."""
    user = User(
        email="test_admin@cloudmart.com",
        hashed_password=get_password_hash("AdminPass123!"),
        full_name="Test Admin",
        role=UserRole.ADMIN,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def customer_user(db: Session) -> User:
    """Create a test customer user fixture."""
    user = User(
        email="test_customer@cloudmart.com",
        hashed_password=get_password_hash("CustomerPass123!"),
        full_name="Test Customer",
        role=UserRole.CUSTOMER,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_token(admin_user: User) -> str:
    """Generate JWT bearer token for admin user."""
    return create_access_token(
        data={"sub": admin_user.email, "user_id": admin_user.id, "role": admin_user.role.value}
    )


@pytest.fixture
def customer_token(customer_user: User) -> str:
    """Generate JWT bearer token for customer user."""
    return create_access_token(
        data={"sub": customer_user.email, "user_id": customer_user.id, "role": customer_user.role.value}
    )


@pytest.fixture
def admin_client(client: TestClient, admin_token: str) -> TestClient:
    """Create an independent client authenticated as administrator."""
    return TestClient(
        app,
        headers={"Authorization": f"Bearer {admin_token}"},
    )


@pytest.fixture
def customer_client(client: TestClient, customer_token: str) -> TestClient:
    """Create an independent client authenticated as customer."""
    return TestClient(
        app,
        headers={"Authorization": f"Bearer {customer_token}"},
    )


@pytest.fixture
def sample_product(db: Session) -> Product:
    """Create a sample product with 20 items in inventory."""
    product = Product(
        name="Test Wireless Headphones",
        description="Noise canceling headphones for testing",
        price=Decimal("99.99"),
        category="Electronics",
        image_url="https://example.com/headphones.jpg",
        is_active=True,
    )
    db.add(product)
    db.flush()

    inventory = Inventory(
        product_id=product.id,
        quantity=20,
    )
    db.add(inventory)
    db.commit()
    db.refresh(product)
    return product
