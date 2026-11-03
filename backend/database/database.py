import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

raw_db_url = os.getenv("DATABASE_URL", "").strip()

if raw_db_url:
    # Render postgres URLs often start with postgres:// which SQLAlchemy requires to be postgresql://
    if raw_db_url.startswith("postgres://"):
        raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)
    DATABASE_URL = raw_db_url
    engine = create_engine(DATABASE_URL)
else:
    # Fallback to local SQLite database if no PostgreSQL URL is provided
    DATABASE_URL = "sqlite:///./notetube.db"
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
