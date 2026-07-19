# Author: Lucas Mohler
# Builds the SQLModel engine from environment variables and exposes a
# per-request database session dependency for FastAPI routes.
import os
from typing import Generator

from sqlmodel import Session, create_engine

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "survey_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "survey_pass")
DB_NAME = os.getenv("DB_NAME", "survey_db")

# Allows local smoke-testing without a MySQL server, e.g.:
#   DATABASE_URL=sqlite:///./local.db
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}",
)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
