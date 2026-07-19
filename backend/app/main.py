# Author: Lucas Mohler
# FastAPI application entry point: wires up CORS, creates database tables
# on startup (retrying while MySQL's Pod is still coming up in Kubernetes),
# exposes a /health endpoint for liveness/readiness probes, and mounts the
# survey CRUD router.
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError
from sqlmodel import Session, SQLModel, text

from .database import engine
from .routers.surveys import router as surveys_router


def _create_db_and_tables_with_retry(attempts: int = 10, delay_seconds: float = 3.0) -> None:
    for attempt in range(1, attempts + 1):
        try:
            SQLModel.metadata.create_all(engine)
            return
        except OperationalError:
            if attempt == attempts:
                raise
            time.sleep(delay_seconds)


@asynccontextmanager
async def lifespan(app: FastAPI):
    _create_db_and_tables_with_retry()
    yield


app = FastAPI(title="Student Survey API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(surveys_router)


@app.get("/health")
def health() -> dict:
    with Session(engine) as session:
        session.exec(text("SELECT 1"))
    return {"status": "ok"}
