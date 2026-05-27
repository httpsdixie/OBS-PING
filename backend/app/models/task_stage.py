"""
TaskStage — one row per assignee per task.
Stages are ordered (order=1 is first, e.g. Writer).
Each stage has its own status that mirrors the task workflow.
"""
import enum
from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship

from app.db.base import Base


class StageStatus(str, enum.Enum):
    pending        = "pending"        # waiting for previous stage to complete
    assigned       = "assigned"       # active, assignee notified
    acknowledged   = "acknowledged"
    submitted      = "submitted"
    checked        = "checked"
    needs_revision = "needs_revision"
    approved       = "approved"       # EIC approved this stage — next stage unlocks


class TaskStage(Base):
    __tablename__ = "task_stages"

    id          = Column(Integer, primary_key=True, index=True)
    task_id     = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    order       = Column(Integer, nullable=False)    # 1, 2, 3...
    label       = Column(String(80), nullable=False)  # "Writer", "Layout", "Photographer"
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status      = Column(SAEnum(StageStatus), default=StageStatus.pending, nullable=False)
    created_at  = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at  = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    task     = relationship("Task", back_populates="stages")
    assignee = relationship("User", foreign_keys=[assignee_id])
