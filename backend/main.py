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

from sqlalchemy import text
from app.db.session import SessionLocal
from app.models.user import User

# Create tables on startup (swap for Alembic in production)
Base.metadata.create_all(bind=engine)

def parse_full_name(name: str):
    if not name:
        return "", "", "", ""
    parts = name.strip().split()
    if not parts:
        return "", "", "", ""
    
    suffixes = {"jr.", "jr", "sr.", "sr", "iii", "iv", "ii", "i"}
    extension = ""
    ext_index = -1
    for idx, part in enumerate(parts):
        clean_part = part.lower().strip(",.")
        if clean_part in suffixes:
            ext_index = idx
            break
    if ext_index != -1:
        extension = parts.pop(ext_index)
        
    if not parts:
        return "", "", "", extension
        
    if len(parts) == 1:
        return parts[0], "", "", extension
    elif len(parts) == 2:
        return parts[0], "", parts[1], extension
    else:
        last_name = parts[-1]
        first_name_parts = []
        middle_name_parts = []
        for i, p in enumerate(parts[:-1]):
            clean_p = p.replace('.', '')
            if (len(p) <= 2 and clean_p.isalpha()) and i > 0:
                middle_name_parts.append(p)
            elif middle_name_parts:
                middle_name_parts.append(p)
            else:
                first_name_parts.append(p)
        if not middle_name_parts and len(first_name_parts) > 1:
            middle_name_parts = [first_name_parts.pop()]
        first_name = " ".join(first_name_parts)
        middle_name = " ".join(middle_name_parts)
        return first_name, middle_name, last_name, extension

# Run migration check
from sqlalchemy import inspect
inspector = inspect(engine)
if inspector.has_table("users"):
    columns = [col["name"] for col in inspector.get_columns("users")]
    if "first_name" not in columns:
        try:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN first_name VARCHAR(50)"))
                conn.execute(text("ALTER TABLE users ADD COLUMN middle_name VARCHAR(50)"))
                conn.execute(text("ALTER TABLE users ADD COLUMN last_name VARCHAR(50)"))
                conn.execute(text("ALTER TABLE users ADD COLUMN extension VARCHAR(10)"))
            
            # Backfill existing names
            db_session = SessionLocal()
            try:
                users_list = db_session.query(User).all()
                for u in users_list:
                    if u.name:
                        first, middle, last, ext = parse_full_name(u.name)
                        u.first_name = first
                        u.middle_name = middle
                        u.last_name = last
                        u.extension = ext
                db_session.commit()
            except Exception as be:
                print(f"Backfill error: {be}")
                db_session.rollback()
            finally:
                db_session.close()
        except Exception as e:
            print(f"Migration error: {e}")

# One-time startup delete of a trial account (will be removed in the next commit)
try:
    db_session = SessionLocal()
    from app.models.user import User
    morpos_user = db_session.query(User).filter(User.email == "josephjaymel.morpos@evsu.edu.ph").first()
    if morpos_user:
        db_session.delete(morpos_user)
        db_session.commit()
        print("Successfully deleted trial account 'josephjaymel.morpos@evsu.edu.ph'!")
    db_session.close()
except Exception as pe:
    print(f"Startup trial user delete error: {pe}")




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
