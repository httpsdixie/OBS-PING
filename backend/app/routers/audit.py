from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, Permission
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogOut
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/audit", tags=["Audit"])


@router.get("/", response_model=List[AuditLogOut])
def get_audit_logs(
    action: Optional[str] = Query(None, description="Filter by action type"),
    affected_user_id: Optional[int] = Query(None, description="Filter by affected user ID"),
    search: Optional[str] = Query(None, description="Filter by search query in detail"),
    start_date: Optional[datetime] = Query(None, description="Start date (inclusive)"),
    end_date: Optional[datetime] = Query(None, description="End date (inclusive)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.has_permission(Permission.view_audit):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )
    q = db.query(AuditLog)
    if action:
        q = q.filter(AuditLog.action == action)
    if affected_user_id:
        q = q.filter(AuditLog.affected_user_id == affected_user_id)
    if search:
        q = q.filter(AuditLog.detail.ilike(f"%{search}%"))
    if start_date:
        q = q.filter(AuditLog.timestamp >= start_date)
    if end_date:
        q = q.filter(AuditLog.timestamp <= end_date)

    return q.order_by(AuditLog.timestamp.desc()).all()
