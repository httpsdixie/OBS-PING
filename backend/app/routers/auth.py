"""
Auth router — login with OTP, forgot password with OTP.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    verify_password,
    create_access_token,
    hash_password,
    create_otp_challenge,
    decode_otp_challenge,
    create_reset_token,
    decode_reset_token,
)
from app.db.session import get_db
from app.models.user import User, UserStatus
from app.models.otp import OtpPurpose
from app.schemas.auth import (
    Token,
    OtpChallengeResponse,
    LoginInitRequest,
    LoginVerifyRequest,
    ForgotPasswordRequest,
    ForgotPasswordVerifyRequest,
    ForgotPasswordVerifyResponse,
    ResetPasswordRequest,
)
from app.services import otp_service

router = APIRouter(prefix="/auth", tags=["Auth"])

GENERIC_RESET_MSG = (
    "If an account exists for that email, a verification code has been sent."
)
OTP_SENT_MSG = "A 6-digit verification code has been sent to your email."


def _challenge_response(user_id: int, purpose: str, dev_code: str | None) -> OtpChallengeResponse:
    return OtpChallengeResponse(
        challenge_token=create_otp_challenge(user_id, purpose),
        message=OTP_SENT_MSG,
        dev_otp=dev_code if settings.OTP_DEBUG_EXPOSE else None,
    )


def _get_active_user_by_email(db: Session, email: str) -> User | None:
    user = db.query(User).filter(User.email == email.lower().strip()).first()
    if not user or user.status == UserStatus.deactivated:
        return None
    return user


@router.post("/login/request", response_model=OtpChallengeResponse)
def login_request_otp(payload: LoginInitRequest, db: Session = Depends(get_db)):
    user = _get_active_user_by_email(db, payload.email)
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    from app.services.system_setting_service import get_setting_bool
    from app.models.user import UserRole
    if get_setting_bool(db, "maintenance_mode", default=False) and user.role != UserRole.super_admin:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="System is under maintenance. Please try again later.",
        )
    if not settings.LOGIN_OTP_ENABLED:
        return OtpChallengeResponse(
            otp_required=False,
            message="Signed in.",
            access_token=create_access_token(user.id),
            token_type="bearer",
        )

    code = otp_service.create_and_send_otp(db, user, OtpPurpose.login)
    return _challenge_response(user.id, OtpPurpose.login.value, code)


@router.post("/login/verify", response_model=Token)
def login_verify_otp(payload: LoginVerifyRequest, db: Session = Depends(get_db)):
    user_id = decode_otp_challenge(payload.challenge_token, OtpPurpose.login.value)
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid or expired session. Sign in again.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.status == UserStatus.deactivated:
        raise HTTPException(status_code=403, detail="Account is not available.")

    otp_service.verify_otp(db, user_id, OtpPurpose.login, payload.otp)
    return Token(access_token=create_access_token(user.id), token_type="bearer")


@router.post("/forgot-password/request", response_model=OtpChallengeResponse)
def forgot_password_request(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = _get_active_user_by_email(db, payload.email)
    if user:
        code = otp_service.create_and_send_otp(db, user, OtpPurpose.password_reset)
        return _challenge_response(user.id, OtpPurpose.password_reset.value, code)

    # Same shape as success to avoid email enumeration
    return OtpChallengeResponse(
        challenge_token="",
        message=GENERIC_RESET_MSG,
    )


@router.post("/forgot-password/verify", response_model=ForgotPasswordVerifyResponse)
def forgot_password_verify(payload: ForgotPasswordVerifyRequest, db: Session = Depends(get_db)):
    user_id = decode_otp_challenge(payload.challenge_token, OtpPurpose.password_reset.value)
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid or expired session. Start over.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.status == UserStatus.deactivated:
        raise HTTPException(status_code=403, detail="Account is not available.")

    otp_service.verify_otp(db, user_id, OtpPurpose.password_reset, payload.otp)
    reset_token = create_reset_token(user_id)
    return ForgotPasswordVerifyResponse(
        reset_token=reset_token,
        message="Code verified successfully. You may now choose a new password."
    )


@router.post("/forgot-password/reset")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    user_id = decode_reset_token(payload.reset_token)
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid or expired session. Start over.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.status == UserStatus.deactivated:
        raise HTTPException(status_code=403, detail="Account is not available.")

    if verify_password(payload.new_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="New password must be different from the current one.")

    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password updated. You can sign in with your new password."}


@router.get("/maintenance-status")
def get_maintenance_status(db: Session = Depends(get_db)):
    from app.services.system_setting_service import get_setting_bool
    return {"maintenance_mode": get_setting_bool(db, "maintenance_mode", default=False)}


from app.dependencies.auth import get_current_user

@router.post("/maintenance-toggle")
def toggle_maintenance_status(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.user import UserRole
    if current_user.role != UserRole.super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the EIC can toggle maintenance mode.",
        )
    
    enabled = payload.get("enabled", False)
    from app.services.system_setting_service import set_setting_bool
    set_setting_bool(db, "maintenance_mode", enabled)
    return {"status": "success", "maintenance_mode": enabled}

