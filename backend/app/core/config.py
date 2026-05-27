"""
Application-wide configuration loaded from environment variables.
Single source of truth — import `settings` everywhere instead of os.getenv().
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./obs_ping.db"
    SECRET_KEY: str = "dev-secret-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # OTP (login + forgot password)
    OTP_EXPIRE_MINUTES: int = 10
    OTP_MAX_ATTEMPTS: int = 5
    OTP_CHALLENGE_EXPIRE_MINUTES: int = 15
    OTP_DEBUG_EXPOSE: bool = False  # include code in API response (dev only)
    LOGIN_OTP_ENABLED: bool = True  # set false to sign in with password only (temporary)

    # SMTP (optional — OTP is logged if unset)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""
    SMTP_USE_TLS: bool = True

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
