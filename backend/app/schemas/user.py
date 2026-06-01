from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator

from app.models.user import UserRole, UserStatus


class UserBase(BaseModel):
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    extension: Optional[str] = None
    email: EmailStr
    role: UserRole = UserRole.staff
    position: Optional[str] = None


class UserCreate(UserBase):
    password: str

    @field_validator("password")
    @classmethod
    def password_strength_check(cls, v: str) -> str:
        from app.core.security import validate_strong_password
        return validate_strong_password(v)


class UserAdminUpdate(BaseModel):
    """Super-admin edits — full name is user-managed only."""
    position: Optional[str] = None
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None
    permissions: Optional[List[str]] = None


class UserPasswordChange(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength_check(cls, v: str) -> str:
        from app.core.security import validate_strong_password
        return validate_strong_password(v)


class UserSelfUpdate(BaseModel):
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    extension: Optional[str] = None
    email: Optional[EmailStr] = None

    @field_validator("first_name")
    @classmethod
    def first_name_not_blank(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        stripped = v.strip()
        if not stripped:
            raise ValueError("First name cannot be empty.")
        return stripped

    @field_validator("last_name")
    @classmethod
    def last_name_not_blank(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        stripped = v.strip()
        if not stripped:
            raise ValueError("Last name cannot be empty.")
        return stripped


class UserOut(UserBase):
    id: int
    name: str
    status: UserStatus
    permissions: List[str] = []
    created_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("permissions", mode="before")
    @classmethod
    def coerce_permissions(cls, v):
        # SQLAlchemy model exposes permissions as a property returning list[str]
        if isinstance(v, list):
            return v
        return []


class SuccessionRequest(BaseModel):
    new_eic_user_id: int
    former_eic_position: Optional[str] = None
