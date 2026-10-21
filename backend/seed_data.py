import os
import sys
from decimal import Decimal

# Ensure backend root directory is in python sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.models.inventory import Inventory
from app.models.product import Product
from app.models.user import User, UserRole
from app.utils.security import get_password_hash


SAMPLE_PRODUCTS = [
    # Electronics
    {
        "name": "Sony WH-1000XM5 Wireless Noise-Cancelling Headphones",
        "description": "Industry-leading noise canceling with two processors and 8 microphones for exceptional sound quality.",
        "price": Decimal("348.00"),
        "category": "Electronics",
        "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
        "stock": 35,
    },
    {
        "name": "Samsung 55-inch Crystal UHD 4K Smart TV",
        "description": "PurColor dynamic crystal color display with HDR and built-in voice assistants.",
        "price": Decimal("499.99"),
        "category": "Electronics",
        "image_url": "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800",
        "stock": 15,
    },
    # Clothing
    {
        "name": "Organic Heavyweight Cotton Hoodie",
        "description": "Premium 450 GSM combed cotton pullover hoodie with ribbed cuffs and kangaroo pocket.",
        "price": Decimal("59.50"),
        "category": "Clothing",
        "image_url": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800",
        "stock": 50,
    },
    {
        "name": "Vintage Wash Denim Trucker Jacket",
        "description": "Classic 100% denim trucker jacket with button-front closure and dual chest pockets.",
        "price": Decimal("89.00"),
        "category": "Clothing",
        "image_url": "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800",
        "stock": 40,
    },
    # Home & Garden
    {
        "name": "Ergonomic High-Back Mesh Office Chair",
        "description": "Breathable mesh back with dynamic lumbar support, 3D armrests, and heavy-duty steel base.",
        "price": Decimal("199.99"),
        "category": "Home & Garden",
        "image_url": "https://images.unsplash.com/photo-1580481077195-c22e4b4f8c2b?w=800",
        "stock": 25,
    },
    {
        "name": "Stainless Steel 10-Piece Tri-Ply Cookware Set",
        "description": "Professional triple-ply stainless steel pots and pans compatible with all cooktops including induction.",
        "price": Decimal("149.95"),
        "category": "Home & Garden",
        "image_url": "https://images.unsplash.com/photo-1584990347449-39908cf69075?w=800",
        "stock": 30,
    },
    # Sports
    {
        "name": "Pro Eco-Grip High-Density Yoga Mat (6mm)",
        "description": "Non-slip textured surface made from eco-friendly biodegradable TPE material with carrying strap.",
        "price": Decimal("34.99"),
        "category": "Sports",
        "image_url": "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800",
        "stock": 80,
    },
    {
        "name": "Adjustable Cast Iron Dumbbell Set (50 lbs)",
        "description": "Rapid-select weight adjustments from 5 to 50 lbs with durable knurled chrome handles.",
        "price": Decimal("119.00"),
        "category": "Sports",
        "image_url": "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800",
        "stock": 20,
    },
    # Books
    {
        "name": "Designing Data-Intensive Applications",
        "description": "The definitive guide to the architecture and principles behind reliable, scalable data systems by Martin Kleppmann.",
        "price": Decimal("42.50"),
        "category": "Books",
        "image_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800",
        "stock": 60,
    },
    {
        "name": "Cloud Native Patterns: Designing Scalable Microservices",
        "description": "Practical patterns and real-world architectures for building fault-tolerant microservices in the cloud.",
        "price": Decimal("49.99"),
        "category": "Books",
        "image_url": "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=800",
        "stock": 45,
    },
]


def seed_users(db) -> tuple[User, User]:
    """Seed default admin and test customer accounts."""
    # 1. Admin User
    admin_email = settings.ADMIN_EMAIL.lower().strip()
    admin = db.query(User).filter(User.email == admin_email).first()
    if admin:
        print(f"[WARNING] Admin user '{admin_email}' already exists. Skipping creation.")
    else:
        admin = User(
            email=admin_email,
            hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
            full_name="CloudMart Administrator",
            role=UserRole.ADMIN,
            is_active=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"[SUCCESS] Created initial admin user: {admin_email}")

    # 2. Customer User
    customer_email = "customer@cloudmart.com"
    customer = db.query(User).filter(User.email == customer_email).first()
    if customer:
        print(f"[WARNING] Customer user '{customer_email}' already exists. Skipping creation.")
    else:
        customer = User(
            email=customer_email,
            hashed_password=get_password_hash("CustomerPassword123!"),
            full_name="Dev Testing Customer",
            role=UserRole.CUSTOMER,
            is_active=True,
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)
        print(f"[SUCCESS] Created test customer user: {customer_email}")

    return admin, customer


def seed_products(db) -> None:
    """Seed 10 sample products across 5 categories with initial stock."""
    created_count = 0
    for item in SAMPLE_PRODUCTS:
        existing = db.query(Product).filter(Product.name == item["name"]).first()
        if existing:
            print(f"[INFO] Product '{item['name']}' already exists. Skipping.")
            continue

        product = Product(
            name=item["name"],
            description=item["description"],
            price=item["price"],
            category=item["category"],
            image_url=item["image_url"],
            is_active=True,
        )
        db.add(product)
        db.flush()

        inventory = Inventory(
            product_id=product.id,
            quantity=item["stock"],
        )
        db.add(inventory)
        created_count += 1

    db.commit()
    print(f"[SUCCESS] Seeded {created_count} sample catalog products with inventory.")


def seed_all() -> None:
    """Main database seeding orchestration function."""
    print("=== Initializing CloudMart Database Seeding ===")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        seed_users(db)
        seed_products(db)
        print("=== Database Seeding Completed Successfully ===")
    finally:
        db.close()


if __name__ == "__main__":
    seed_all()
