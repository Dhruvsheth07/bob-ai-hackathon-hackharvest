import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.user import User
from app.services.auth_service import register_user

from app.config import get_settings

# Use pydantic-settings to load the correct database URL from .env
settings = get_settings()
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed():
    db = SessionLocal()
    try:
        from app.models.role import Role
        # Check if ADMIN role exists
        admin_role = db.query(Role).filter(Role.name == "ADMIN").first()
        if not admin_role:
            print("Creating ADMIN role...")
            admin_role = Role(name="ADMIN")
            db.add(admin_role)
            db.commit()
            
        # Check if admin already exists
        admin = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin:
            print("Creating admin user...")
            register_user(db, "admin@example.com", "admin", "Admin User", "ADMIN")
            print("Admin created successfully.")
        else:
            print("Admin already exists.")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
