"""
Tasks router — multi-stage task CRUD and workflow endpoints.

Business rules:
- Delete: only when status = assigned (no stage has been touched yet). EIC only.
- Archive: only when published OR deadline has passed (overdue).
- Poke: 1-minute cooldown per task.
"""
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, UserRole, Permission
from app.models.task import Task, TaskStatus
from app.models.task_stage import TaskStage, StageStatus
from app.models.notification import Notification, NotificationType
from app.schemas.task import TaskCreate, TaskUpdate, TaskOut, RevisionRequest
from app.dependencies.auth import get_current_user, require_roles
from app.services import task_service

router = APIRouter(prefix="/tasks", tags=["Tasks"])

_ADMIN_ROLES    = require_roles(UserRole.super_admin, UserRole.admin)
_WORKFLOW_ROLES = require_roles(UserRole.super_admin, UserRole.admin, UserRole.staff)

# Statuses where staff is already actively working — deletion blocked
_ACTIVE_STAGE_STATUSES = {
    StageStatus.acknowledged,
    StageStatus.submitted,
    StageStatus.checked,
}


@router.post("/", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.has_permission(Permission.create_tasks):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    return task_service.create_task(db, payload, creator=current_user)


@router.get("/", response_model=List[TaskOut])
def list_tasks(
    task_status: Optional[TaskStatus] = None,
    category: Optional[str] = None,
    archived: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Task)
    q = task_service.apply_task_list_scope(q, current_user)
    q = q.filter(Task.archived == archived)

    if task_status:
        q = q.filter(Task.status == task_status)
    if category:
        q = q.filter(Task.category.ilike(f"%{category}%"))

    return q.order_by(Task.deadline).all()


@router.get("/{task_id}", response_model=TaskOut)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = task_service.get_task_or_404(db, task_id)
    if not current_user.has_permission(Permission.view_all_tasks):
        task_service._assert_access(current_user, task)
    return task


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.has_permission(Permission.create_tasks):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")

    task = task_service.get_task_or_404(db, task_id)

    # Lock editing once any stage has been acknowledged
    has_active = any(s.status in _ACTIVE_STAGE_STATUSES for s in task.stages)
    if has_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task can no longer be edited — a stage is already in progress.",
        )

    return task_service.update_task(db, task_id, payload)


# ---------------------------------------------------------------------------
# Stage workflow endpoints
# ---------------------------------------------------------------------------

@router.post("/{task_id}/stages/{stage_id}/advance", response_model=TaskOut)
def advance_stage(
    task_id: int,
    stage_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(_WORKFLOW_ROLES),
):
    return task_service.advance_stage(db, task_id, stage_id, actor=current_user)


@router.post("/{task_id}/stages/{stage_id}/send-back", response_model=TaskOut)
def send_stage_back(
    task_id: int,
    stage_id: int,
    payload: RevisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.has_permission(Permission.create_tasks):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    return task_service.send_stage_back(
        db, task_id, stage_id, actor=current_user, comment=payload.comment
    )


@router.post("/{task_id}/stages/{stage_id}/poke", status_code=status.HTTP_204_NO_CONTENT)
def poke_stage(
    task_id: int,
    stage_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.has_permission(Permission.poke):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")

    # 1-minute cooldown — check last poke notification for this task
    one_minute_ago = datetime.now(timezone.utc) - timedelta(minutes=1)
    recent_poke = (
        db.query(Notification)
        .filter(
            Notification.task_id == task_id,
            Notification.type == NotificationType.manual_poke,
            Notification.sent_at >= one_minute_ago,
        )
        .first()
    )
    if recent_poke:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Please wait 1 minute before poking again.",
        )

    task_service.poke_stage(db, task_id, stage_id, poked_by=current_user)


# ---------------------------------------------------------------------------
# Archive / Unarchive / Delete
# ---------------------------------------------------------------------------

@router.post("/{task_id}/archive", response_model=TaskOut)
def archive_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.has_permission(Permission.create_tasks):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")

    task = task_service.get_task_or_404(db, task_id)

    now = datetime.now(timezone.utc)
    deadline = task.deadline
    if deadline.tzinfo is None:
        # Treat database naive datetime as Philippine Time (UTC+8)
        from datetime import timedelta
        deadline = deadline.replace(tzinfo=timezone(timedelta(hours=8)))

    is_published = task.status == TaskStatus.published
    is_overdue   = deadline < now

    if not is_published and not is_overdue:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only archive published tasks or tasks past their deadline.",
        )

    task.archived = True
    db.commit()
    db.refresh(task)
    return task


@router.post("/{task_id}/unarchive", response_model=TaskOut)
def unarchive_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.has_permission(Permission.create_tasks):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    task = task_service.get_task_or_404(db, task_id)
    task.archived = False
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.super_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the EIC can delete tasks.")

    task = task_service.get_task_or_404(db, task_id)

    # Only deletable when still in assigned state (no one has touched it)
    if task.status != TaskStatus.assigned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete — task is '{task.status.value}'. Only unacknowledged tasks can be deleted.",
        )

    task_service.delete_task(db, task_id)
