"""
Notification model — records every alert sent to a user.
Covers automated weekend reminders, manual pokes, and status-change alerts.
"""
import enum
from datetime import datetime, timezone

from sqlalchemy import Column, Integer, Text, DateTime, Boolean, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship

from app.db.base import Base


class NotificationType(str, enum.Enum):
    automated_weekend  = "automated_weekend"
    deadline_reminder  = "deadline_reminder"
    manual_poke        = "manual_poke"
    task_assigned      = "task_assigned"
    status_update      = "status_update"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    type = Column(SAEnum(NotificationType), nullable=False)
    message = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False)
    sent_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="notifications")
    task = relationship("Task", back_populates="notifications")
