"""
User model — represents every member of The Observer staff.
Roles follow the RBAC spec: super_admin (EIC), admin (Ed Board),
consultant (read-only), staff (writers / layout / photojournalists).

Per-user module permissions extend the base role with granular access grants.
"""
import enum
import json
from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, DateTime, Text, Enum as SAEnum
from sqlalchemy.orm import relationship

from app.db.base import Base


class UserRole(str, enum.Enum):
    super_admin = "super_admin"   # Editor-in-Chief
    admin = "admin"               # Editorial Board / Section Heads
    consultant = "consultant"     # Editorial Consultant (read-only)
    staff = "staff"               # Writers, Layout Artists, Photojournalists


class UserStatus(str, enum.Enum):
    active = "active"
    deactivated = "deactivated"


# All toggleable module permissions
class Permission(str, enum.Enum):
    view_all_tasks = "view_all_tasks"   # See every task, not just own
    view_directory = "view_directory"   # Access staff directory
    view_audit     = "view_audit"       # Read audit log
    create_tasks   = "create_tasks"     # Create and assign tasks
    poke           = "poke"             # Send manual reminders


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    first_name = Column(String(50), nullable=True)
    middle_name = Column(String(50), nullable=True)
    last_name = Column(String(50), nullable=True)
    extension = Column(String(10), nullable=True)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.staff, nullable=False)
    position = Column(String(120), nullable=True)
    status = Column(SAEnum(UserStatus), default=UserStatus.active, nullable=False)
    # JSON list of Permission values granted beyond the base role
    _permissions = Column("permissions", Text, nullable=False, default="[]")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    assigned_tasks = relationship(
        "Task", back_populates="assignee", foreign_keys="Task.assignee_id"
    )
    created_tasks = relationship(
        "Task", back_populates="creator", foreign_keys="Task.creator_id"
    )
    notifications = relationship("Notification", back_populates="user")
    audit_logs_as_admin = relationship(
        "AuditLog", back_populates="admin", foreign_keys="AuditLog.admin_id"
    )

    @property
    def permissions(self) -> list[str]:
        try:
            return json.loads(self._permissions or "[]")
        except (ValueError, TypeError):
            return []

    @permissions.setter
    def permissions(self, value: list[str]):
        self._permissions = json.dumps(value)

    def has_permission(self, perm: Permission) -> bool:
        """Returns True if the user has the permission via role OR explicit grant."""
        # Only super_admin has everything by default
        if self.role == UserRole.super_admin:
            return True
        return perm.value in self.permissions
