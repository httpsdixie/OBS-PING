"""OTP codes for login verification and password reset."""
import enum
from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base import Base


class OtpPurpose(str, enum.Enum):
    login = "login"
    password_reset = "password_reset"


class OtpCode(Base):
    __tablename__ = "otp_codes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    purpose = Column(SAEnum(OtpPurpose), nullable=False)
    code_hash = Column(String(64), nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    used = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User")
