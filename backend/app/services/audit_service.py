"""
Audit service — writes immutable log entries for administrative actions.
Called by other services; never called directly from routers.
"""
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def log_action(
    db: Session,
    admin_id: int,
    action: str,
    affected_user_id: int | None = None,
    detail: str = "",
) -> None:
    db.add(
        AuditLog(
            admin_id=admin_id,
            action=action,
            affected_user_id=affected_user_id,
            detail=detail,
        )
    )
