"""Create, send, and verify one-time passwords."""
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.otp import OtpCode, OtpPurpose
from app.models.user import User
from app.services.email_service import send_otp_email


def _hash_code(code: str) -> str:
    return hashlib.sha256(f"{code}:{settings.SECRET_KEY}".encode()).hexdigest()


def _generate_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _invalidate_active(db: Session, user_id: int, purpose: OtpPurpose) -> None:
    db.query(OtpCode).filter(
        OtpCode.user_id == user_id,
        OtpCode.purpose == purpose,
        OtpCode.used == False,  # noqa: E712
    ).update({"used": True})
    db.commit()


def create_and_send_otp(db: Session, user: User, purpose: OtpPurpose) -> str:
    """Returns the plain OTP (for debug expose only)."""
    _invalidate_active(db, user.id, purpose)
    code = _generate_code()
    record = OtpCode(
        user_id=user.id,
        purpose=purpose,
        code_hash=_hash_code(code),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
    )
    db.add(record)
    db.commit()
    send_otp_email(user.email, code, purpose.value)
    return code


def verify_otp(db: Session, user_id: int, purpose: OtpPurpose, code: str) -> None:
    record = (
        db.query(OtpCode)
        .filter(
            OtpCode.user_id == user_id,
            OtpCode.purpose == purpose,
            OtpCode.used == False,  # noqa: E712
        )
        .order_by(OtpCode.created_at.desc())
        .first()
    )
    if not record:
        raise HTTPException(status_code=400, detail="No active verification code. Request a new one.")
    exp = record.expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Verification code has expired. Request a new one.")
    if record.attempts >= settings.OTP_MAX_ATTEMPTS:
        record.used = True
        db.commit()
        raise HTTPException(status_code=400, detail="Too many attempts. Request a new code.")

    if _hash_code(code.strip()) != record.code_hash:
        record.attempts += 1
        db.commit()
        remaining = settings.OTP_MAX_ATTEMPTS - record.attempts
        raise HTTPException(
            status_code=400,
            detail=f"Incorrect code. {remaining} attempt(s) remaining.",
        )

    record.used = True
    db.commit()
