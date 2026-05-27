"""Send OTP emails via Resend API (HTTPS) or SMTP when configured; otherwise log to console."""
import logging
import smtplib
import urllib.request
import json
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


def _purpose_label(purpose: str) -> str:
    if purpose == "password_reset":
        return "password reset"
    return "sign-in"


def _is_smtp_enabled() -> bool:
    host = (settings.SMTP_HOST or "").strip()
    user = (settings.SMTP_USER or "").strip()
    # Check for empty or standard placeholder values
    if not host or host in ("--", "change_me", "placeholder", "None", "null"):
        return False
    if not user or user in ("--", "change_me", "placeholder", "None", "null"):
        return False
    return True


def _send_via_resend(to_email: str, subject: str, body: str) -> bool:
    api_key = (settings.RESEND_API_KEY or "").strip()
    if not api_key or api_key in ("--", "change_me", "placeholder", "None", "null"):
        return False

    try:
        url = "https://api.resend.com/emails"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # Free Resend accounts can ONLY send from onboarding@resend.dev.
        # We force onboarding@resend.dev to guarantee successful delivery out-of-the-box.
        from_email = "OBS PING <onboarding@resend.dev>"

        data = {
            "from": from_email,
            "to": [to_email],
            "subject": subject,
            "text": body
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            res_body = response.read().decode("utf-8")
            logger.info("Email sent successfully via Resend API to %s: %s", to_email, res_body)
            return True
    except Exception as e:
        logger.error("Failed to send email to %s via Resend API (trying SMTP fallback): %s", to_email, str(e))
        return False


def send_otp_email(to_email: str, code: str, purpose: str) -> None:
    subject = f"OBS PING — Your {_purpose_label(purpose)} code"
    body = (
        f"Your verification code is: {code}\n\n"
        f"This code expires in {settings.OTP_EXPIRE_MINUTES} minutes.\n"
        "If you did not request this, you can ignore this email.\n\n"
        "— The Observer (OBS PING)"
    )

    # Try Resend HTTPS first (unaffected by port blocks)
    if _send_via_resend(to_email, subject, body):
        return

    # Fallback to SMTP
    if _is_smtp_enabled():
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
            logger.info("OTP email sent to %s (%s) via SMTP", to_email, purpose)
        except Exception as e:
            logger.error("Failed to send OTP email to %s via SMTP (falling back to log): %s", to_email, str(e))
            logger.warning(
                "SMTP connection failed — OTP for %s (%s): %s",
                to_email,
                purpose,
                code,
            )
    else:
        logger.warning(
            "SMTP/Resend not configured — OTP for %s (%s): %s",
            to_email,
            purpose,
            code,
        )


def send_notification_email(to_email: str, subject: str, message: str) -> None:
    body = (
        f"{message}\n\n"
        "— The Observer (OBS PING)"
    )

    # Try Resend HTTPS first (unaffected by port blocks)
    if _send_via_resend(to_email, subject, body):
        return

    # Fallback to SMTP
    if _is_smtp_enabled():
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
            logger.info("Notification email sent to %s via SMTP", to_email)
        except Exception as e:
            logger.error("Failed to send notification email to %s via SMTP: %s", to_email, str(e))
    else:
        logger.warning(
            "SMTP/Resend not configured — Email to %s: [%s] %s",
            to_email,
            subject,
            message,
        )



