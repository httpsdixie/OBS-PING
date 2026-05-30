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


def _send_via_resend(to_email: str, subject: str, body: str, html_content: str = None) -> bool:
    api_key = (settings.RESEND_API_KEY or "").strip()
    if not api_key or api_key in ("--", "change_me", "placeholder", "None", "null"):
        return False

    try:
        url = "https://api.resend.com/emails"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "obs-ping-backend/1.0"
        }
        
        # Free Resend accounts can ONLY send from onboarding@resend.dev.
        # We force onboarding@resend.dev to guarantee successful delivery out-of-the-box.
        from_email = "OBS PING <onboarding@resend.dev>"

        data = {
            "from": from_email,
            "to": [to_email],
            "subject": subject
        }
        if html_content:
            data["html"] = html_content
            # Keep plain text fallback in case Resend supports text + html dual payload
            data["text"] = body
        else:
            data["text"] = body

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


# --- Premium Responsive HTML Email Templates ---

OTP_HTML_TEMPLATE = """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>OBS PING Verification Code</title>
  <style>
    body {{
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      background-color: #f7f9fc;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }}
    .wrapper {{
      width: 100%;
      background-color: #f7f9fc;
      padding: 40px 0;
    }}
    .container {{
      max-width: 520px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
      border: 1px solid #eef2f6;
    }}
    .header {{
      background-color: #800000;
      padding: 30px;
      text-align: center;
    }}
    .logo {{
      font-size: 26px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 2px;
      margin: 0;
    }}
    .subtitle {{
      font-size: 12px;
      color: #ffcccc;
      margin: 5px 0 0 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }}
    .content {{
      padding: 40px 35px;
      color: #333333;
    }}
    .greeting {{
      font-size: 18px;
      font-weight: 700;
      margin: 0 0 15px 0;
      color: #1a1a1a;
    }}
    .description {{
      font-size: 14px;
      line-height: 1.6;
      color: #555555;
      margin: 0 0 25px 0;
    }}
    .code-box {{
      background-color: #fcf4f4;
      border: 2px dashed #ffcccc;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 30px 0;
    }}
    .code-number {{
      font-size: 38px;
      font-weight: 800;
      color: #800000;
      letter-spacing: 6px;
      margin: 0;
      font-family: 'Courier New', Courier, monospace;
    }}
    .code-label {{
      font-size: 11px;
      color: #888888;
      text-transform: uppercase;
      margin-top: 8px;
      letter-spacing: 1px;
    }}
    .expiry {{
      font-size: 13px;
      color: #666666;
      background-color: #f7f9fc;
      padding: 10px 18px;
      border-radius: 8px;
      display: inline-block;
      margin-bottom: 25px;
      border: 1px solid #eef2f6;
    }}
    .security-note {{
      font-size: 12px;
      color: #999999;
      line-height: 1.5;
      border-top: 1px solid #eeeeee;
      padding-top: 20px;
      margin-top: 25px;
    }}
    .footer {{
      background-color: #f7f9fc;
      padding: 25px 30px;
      text-align: center;
      border-top: 1px solid #eef2f6;
    }}
    .footer-text {{
      font-size: 11px;
      color: #999999;
      margin: 0;
    }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 class="logo">OBS PING</h1>
        <p class="subtitle">The Observer</p>
      </div>
      <div class="content">
        <h2 class="greeting">Hello,</h2>
        <p class="description">You requested a verification code to complete your <strong>{purpose_label}</strong>. Please use the secure code below:</p>
        
        <div class="code-box">
          <div class="code-number">{code}</div>
          <div class="code-label">One-Time Verification Code</div>
        </div>
        
        <center>
          <div class="expiry"> This code expires in <strong>{expires} minutes</strong></div>
        </center>
        
        <p class="security-note">
           <strong>Security Notice:</strong> If you did not request this verification code, please ignore this email or change your password immediately to keep your account secure.
        </p>
      </div>
      <div class="footer">
        <p class="footer-text">© 2026 The Observer. All rights reserved.</p>
        <p class="footer-text" style="margin-top: 5px; color: #bbbbbb;">OBS PING Notification System</p>
      </div>
    </div>
  </div>
</body>
</html>
"""

NOTIFICATION_HTML_TEMPLATE = """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{subject}</title>
  <style>
    body {{
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      background-color: #f7f9fc;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }}
    .wrapper {{
      width: 100%;
      background-color: #f7f9fc;
      padding: 40px 0;
    }}
    .container {{
      max-width: 520px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
      border: 1px solid #eef2f6;
    }}
    .header {{
      background-color: #800000;
      padding: 30px;
      text-align: center;
    }}
    .logo {{
      font-size: 26px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 2px;
      margin: 0;
    }}
    .subtitle {{
      font-size: 12px;
      color: #ffcccc;
      margin: 5px 0 0 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }}
    .content {{
      padding: 40px 35px;
      color: #333333;
    }}
    .greeting {{
      font-size: 18px;
      font-weight: 700;
      margin: 0 0 15px 0;
      color: #1a1a1a;
    }}
    .alert-box {{
      background-color: #fafbfc;
      border-left: 4px solid #800000;
      border-radius: 0 8px 8px 0;
      padding: 20px;
      margin: 25px 0;
      font-size: 14px;
      line-height: 1.6;
      color: #444444;
    }}
    .cta-button {{
      background-color: #800000;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 14px;
      display: inline-block;
      margin: 20px 0;
      box-shadow: 0 4px 12px rgba(128, 0, 0, 0.15);
    }}
    .security-note {{
      font-size: 12px;
      color: #999999;
      line-height: 1.5;
      border-top: 1px solid #eeeeee;
      padding-top: 20px;
      margin-top: 25px;
    }}
    .footer {{
      background-color: #f7f9fc;
      padding: 25px 30px;
      text-align: center;
      border-top: 1px solid #eef2f6;
    }}
    .footer-text {{
      font-size: 11px;
      color: #999999;
      margin: 0;
    }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 class="logo">OBS PING</h1>
        <p class="subtitle">The Observer</p>
      </div>
      <div class="content">
        <h2 class="greeting">Hello,</h2>
        <p class="description" style="font-size: 14px; line-height: 1.5; color: #555555;">We have an update regarding your tasks on <strong>OBS PING</strong>:</p>
        
        <div class="alert-box">
          {message}
        </div>
        
        <center>
          <a href="https://obs-ping.vercel.app" class="cta-button" target="_blank">Open OBS PING</a>
        </center>
        
        <p class="security-note">
          Please do not reply to this email. If you need assistance, please contact the Editor-in-Chief or System Administrator.
        </p>
      </div>
      <div class="footer">
        <p class="footer-text">© 2026 The Observer. All rights reserved.</p>
        <p class="footer-text" style="margin-top: 5px; color: #bbbbbb;">OBS PING Notification System</p>
      </div>
    </div>
  </div>
</body>
</html>
"""


def send_otp_email(to_email: str, code: str, purpose: str) -> None:
    subject = f"OBS PING — Your {_purpose_label(purpose)} code"
    body = (
        f"Your verification code is: {code}\n\n"
        f"This code expires in {settings.OTP_EXPIRE_MINUTES} minutes.\n"
        "If you did not request this, you can ignore this email.\n\n"
        "— The Observer (OBS PING)"
    )
    
    # Generate the beautiful HTML layout
    html_content = OTP_HTML_TEMPLATE.format(
        purpose_label=_purpose_label(purpose),
        code=code,
        expires=settings.OTP_EXPIRE_MINUTES
    )

    # 1. Try SMTP first if enabled (actual real SMTP delivery)
    if _is_smtp_enabled():
        msg = MIMEText(html_content, "html")
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
            return  # Success!
        except Exception as e:
            logger.error("Failed to send OTP email to %s via SMTP (trying Resend fallback): %s", to_email, str(e))

    # 2. Try Resend HTTPS fallback (unaffected by port blocks)
    if _send_via_resend(to_email, subject, body, html_content):
        return

    # If both failed or are not configured, log a warning
    logger.warning(
        "SMTP/Resend failed or not configured — OTP for %s (%s): %s",
        to_email,
        purpose,
        code,
    )


def send_notification_email(to_email: str, subject: str, message: str) -> None:
    body = (
        f"{message}\n\n"
        "— The Observer (OBS PING)"
    )
    
    # Generate the beautiful HTML layout
    html_content = NOTIFICATION_HTML_TEMPLATE.format(
        subject=subject,
        message=message
    )

    # 1. Try SMTP first if enabled (actual real SMTP delivery)
    if _is_smtp_enabled():
        msg = MIMEText(html_content, "html")
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
            return  # Success!
        except Exception as e:
            logger.error("Failed to send notification email to %s via SMTP (trying Resend fallback): %s", to_email, str(e))

    # 2. Try Resend HTTPS fallback (unaffected by port blocks)
    if _send_via_resend(to_email, subject, body, html_content):
        return

    logger.warning(
        "SMTP/Resend failed or not configured — Email to %s: [%s] %s",
        to_email,
        subject,
        message,
    )



