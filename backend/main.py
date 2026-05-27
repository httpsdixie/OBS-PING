"""
OBS PING — application entry point.
Registers all routers and middleware. No business logic lives here.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.base import Base
from app.db.session import engine

# Import all models so SQLAlchemy registers them before create_all()
import app.models  # noqa: F401

from app.routers import auth, users, tasks, notifications, audit
from app.services.scheduler_service import start_scheduler

# Create tables on startup (swap for Alembic in production)
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = start_scheduler()
    yield
    scheduler.shutdown()


app = FastAPI(
    title="OBS PING API",
    description="Observer Task Assigning and Reminding System — Backend",
    version="1.0.0",
    lifespan=lifespan,
    redirect_slashes=False,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to your frontend origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(tasks.router)
app.include_router(notifications.router)
app.include_router(audit.router)


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "app": "OBS PING API"}
