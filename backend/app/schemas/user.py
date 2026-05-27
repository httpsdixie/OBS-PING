from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator

from app.models.user import UserRole, UserStatus


class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: UserRole = UserRole.staff
    position: Optional[str] = None


class UserCreate(UserBase):
    password: str


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
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("New password must be at least 8 characters.")
        return v


class UserSelfUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        stripped = v.strip()
        if not stripped:
            raise ValueError("Name cannot be empty.")
        return stripped


class UserOut(UserBase):
    id: int
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
