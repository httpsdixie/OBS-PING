"""
Task model — core workflow entity.

Order of Operations:
  Assigned → Acknowledged → Submitted (to head) →
  Checked (by head) → Pending EIC → Published
  Needs Revision at Checked or Pending EIC sends back to Acknowledged.
"""
import enum
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, Integer, String, Text, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship

from app.db.base import Base


class TaskStatus(str, enum.Enum):
    assigned       = "assigned"
    acknowledged   = "acknowledged"
    submitted      = "submitted"
    checked        = "checked"
    needs_revision = "needs_revision"
    pending_eic    = "pending_eic"
    published      = "published"


class Task(Base):
    __tablename__ = "tasks"

    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    category    = Column(String(80), nullable=True)
    event_tag   = Column(String(120), nullable=True)
    drive_link  = Column(String(500), nullable=True)
    deadline    = Column(DateTime, nullable=False)
    status      = Column(SAEnum(TaskStatus), default=TaskStatus.assigned, nullable=False)

    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    creator_id  = Column(Integer, ForeignKey("users.id"), nullable=False)

    archived   = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    assignee      = relationship("User", back_populates="assigned_tasks", foreign_keys=[assignee_id])
    creator       = relationship("User", back_populates="created_tasks",  foreign_keys=[creator_id])
    notifications = relationship("Notification", back_populates="task")
    stages        = relationship(
        "TaskStage",
        back_populates="task",
        order_by="TaskStage.order",
        cascade="all, delete-orphan",
    )
