from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class Token(BaseModel):
    access_token: str
    token_type: str


class OtpChallengeResponse(BaseModel):
    challenge_token: str = ""
    message: str
    dev_otp: Optional[str] = None
    otp_required: bool = True
    access_token: Optional[str] = None
    token_type: Optional[str] = None


class LoginInitRequest(BaseModel):
    email: EmailStr
    password: str


class LoginVerifyRequest(BaseModel):
    challenge_token: str
    otp: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    challenge_token: str
    otp: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")
    new_password: str = Field(min_length=8)
