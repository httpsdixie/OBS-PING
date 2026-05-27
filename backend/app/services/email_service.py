"""Send OTP emails via SMTP when configured; otherwise log to console."""
import logging
import smtplib
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


def _purpose_label(purpose: str) -> str:
    if purpose == "password_reset":
        return "password reset"
    return "sign-in"


def send_otp_email(to_email: str, code: str, purpose: str) -> None:
    subject = f"OBS PING — Your {_purpose_label(purpose)} code"
    body = (
        f"Your verification code is: {code}\n\n"
        f"This code expires in {settings.OTP_EXPIRE_MINUTES} minutes.\n"
        "If you did not request this, you can ignore this email.\n\n"
        "— The Observer (OBS PING)"
    )

    if settings.SMTP_HOST and settings.SMTP_USER:
        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
        msg["To"] = to_email
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        logger.info("OTP email sent to %s (%s)", to_email, purpose)
    else:
        logger.warning(
            "SMTP not configured — OTP for %s (%s): %s",
            to_email,
            purpose,
            code,
        )


def send_notification_email(to_email: str, subject: str, message: str) -> None:
    body = (
        f"{message}\n\n"
        "— The Observer (OBS PING)"
    )

    if settings.SMTP_HOST and settings.SMTP_USER:
        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
        msg["To"] = to_email
        try:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                if settings.SMTP_USE_TLS:
                    server.starttls()
                if settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
            logger.info("Notification email sent to %s", to_email)
        except Exception as e:
            logger.error("Failed to send notification email to %s: %s", to_email, str(e))
    else:
        logger.warning(
            "SMTP not configured — Email to %s: [%s] %s",
            to_email,
            subject,
            message,
        )

