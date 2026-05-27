"""
Audit router — read-only access to the administrative audit trail.
Accessible to super_admin, admin, or any user granted view_audit permission.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, Permission
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogOut
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/audit", tags=["Audit"])


@router.get("/", response_model=List[AuditLogOut])
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.has_permission(Permission.view_audit):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()
