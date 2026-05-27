"""
AuditLog model — immutable record of every administrative action.
Covers account creation, role changes, deactivations, and EIC succession.
"""
from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(200), nullable=False)        # e.g. "ACCOUNT_CREATED", "EIC_TRANSFER"
    affected_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    detail = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    admin = relationship("User", back_populates="audit_logs_as_admin", foreign_keys=[admin_id])
    affected_user = relationship("User", foreign_keys=[affected_user_id])
