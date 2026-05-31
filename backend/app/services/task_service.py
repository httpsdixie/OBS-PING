"""
Task service — business logic for the multi-stage task lifecycle.

Per-stage workflow:
  Staff:  assigned → acknowledged → submitted
          needs_revision → acknowledged (re-acknowledge after revision)
  Admin:  submitted → checked
  EIC:    checked → approved  (if last stage → task.status = published)
                             (else → next stage status = assigned)

Send-back:
  Admin:  submitted → needs_revision
  EIC:    checked   → needs_revision
"""
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.task import Task, TaskStatus
from app.models.task_stage import TaskStage, StageStatus
from app.models.user import User, UserRole, UserStatus, Permission
from app.models.notification import NotificationType
from app.schemas.task import TaskCreate, TaskUpdate
from app.services.notification_service import send as notify


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_task_or_404(db: Session, task_id: int) -> Task:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
    return task


def get_stage_or_404(db: Session, task_id: int, stage_id: int) -> TaskStage:
    stage = (
        db.query(TaskStage)
        .filter(TaskStage.id == stage_id, TaskStage.task_id == task_id)
        .first()
    )
    if not stage:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stage not found.")
    return stage


def _assert_stage_access(user: User, stage: TaskStage) -> None:
    """Staff may only interact with stages assigned to them."""
    if user.role == UserRole.staff and stage.assignee_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")


def _assert_access(user: User, task: Task) -> None:
    """Users without view_all_tasks may only access tasks where they have a stage."""
    if user.has_permission(Permission.view_all_tasks):
        return
    if not any(s.assignee_id == user.id for s in task.stages):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")


def apply_task_list_scope(q, user: User):
    """Restrict task queries to assignee's stages unless user can view all tasks."""
    if user.has_permission(Permission.view_all_tasks):
        return q
    return q.join(TaskStage).filter(TaskStage.assignee_id == user.id).distinct()


def _overall_status_from_stages(stages: list[TaskStage]) -> TaskStatus:
    """Derive the overall task status from its stages."""
    if not stages:
        return TaskStatus.assigned

    # Find the active (non-pending, non-approved) stage
    for stage in sorted(stages, key=lambda s: s.order):
        if stage.status == StageStatus.approved:
            continue
        if stage.status == StageStatus.pending:
            # All previous stages approved, this one is next but not started
            return TaskStatus.assigned
        # Map stage status → task status
        mapping = {
            StageStatus.assigned:       TaskStatus.assigned,
            StageStatus.acknowledged:   TaskStatus.acknowledged,
            StageStatus.submitted:      TaskStatus.submitted,
            StageStatus.checked:        TaskStatus.checked,
            StageStatus.needs_revision: TaskStatus.needs_revision,
        }
        return mapping.get(stage.status, TaskStatus.assigned)

    # All stages approved
    return TaskStatus.published


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

def create_task(db: Session, payload: TaskCreate, creator: User) -> Task:
    if not payload.stages:
        raise HTTPException(status_code=400, detail="At least one stage is required.")

    # Enforce 2-day buffer validation (FR-04)
    now = datetime.now(timezone.utc)
    deadline = payload.deadline
    if deadline.tzinfo is None:
        from datetime import timedelta
        deadline = deadline.replace(tzinfo=timezone(timedelta(hours=8)))
    if deadline < now + timedelta(days=2):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Deadline must be at least 48 hours (2 days) from the current date and time.",
        )

    # Validate all assignees exist and are active
    for sc in payload.stages:
        assignee = db.query(User).filter(User.id == sc.assignee_id).first()
        if not assignee or assignee.status == UserStatus.deactivated:
            raise HTTPException(
                status_code=400,
                detail=f"Assignee id={sc.assignee_id} not found or deactivated.",
            )

    task = Task(
        title=payload.title,
        description=payload.description,
        category=payload.category,
        event_tag=payload.event_tag,
        drive_link=payload.drive_link,
        deadline=payload.deadline,
        creator_id=creator.id,
        status=TaskStatus.assigned,
    )
    db.add(task)
    db.flush()  # get task.id

    for idx, sc in enumerate(payload.stages, start=1):
        stage_status = StageStatus.assigned if idx == 1 else StageStatus.pending
        stage = TaskStage(
            task_id=task.id,
            order=idx,
            label=sc.label,
            assignee_id=sc.assignee_id,
            status=stage_status,
        )
        db.add(stage)

    db.flush()

    # Notify first stage assignee
    first = payload.stages[0]
    notify(
        db, first.assignee_id, NotificationType.task_assigned,
        f"You have been assigned: {task.title}",
        task_id=task.id,
    )

    db.commit()
    db.refresh(task)
    return task


def update_task(db: Session, task_id: int, payload: TaskUpdate) -> Task:
    task = get_task_or_404(db, task_id)

    # Enforce task edit lock after acknowledgment/submission (FR-11 / Data Integrity Rules)
    if task.status != TaskStatus.assigned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tasks cannot be edited once they have been acknowledged or submitted by the assignee.",
        )

    # Enforce 2-day buffer validation on update if deadline is being changed (FR-04)
    if payload.deadline is not None:
        now = datetime.now(timezone.utc)
        deadline = payload.deadline
        if deadline.tzinfo is None:
            from datetime import timedelta
            deadline = deadline.replace(tzinfo=timezone(timedelta(hours=8)))
        if deadline < now + timedelta(days=2):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Deadline must be at least 48 hours (2 days) from the current date and time.",
            )

    for field, value in payload.model_dump(exclude_unset=True, exclude={"stages"}).items():
        setattr(task, field, value)

    # Update stages if provided
    if payload.stages is not None:
        # Validate all new assignees exist and are active
        for sc in payload.stages:
            assignee = db.query(User).filter(User.id == sc.assignee_id).first()
            if not assignee or assignee.status == UserStatus.deactivated:
                raise HTTPException(
                    status_code=400,
                    detail=f"Assignee id={sc.assignee_id} not found or deactivated.",
                )

        # Delete existing stages
        db.query(TaskStage).filter(TaskStage.task_id == task.id).delete()

        # Re-create stages
        for idx, sc in enumerate(payload.stages, start=1):
            stage_status = StageStatus.assigned if idx == 1 else StageStatus.pending
            stage = TaskStage(
                task_id=task.id,
                order=idx,
                label=sc.label,
                assignee_id=sc.assignee_id,
                status=stage_status,
            )
            db.add(stage)

        db.flush()

        # Notify first stage assignee
        first = payload.stages[0]
        notify(
            db, first.assignee_id, NotificationType.task_assigned,
            f"You have been assigned: {task.title}",
            task_id=task.id,
        )

    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task_id: int) -> None:
    task = get_task_or_404(db, task_id)
    db.delete(task)
    db.commit()


# ---------------------------------------------------------------------------
# Stage workflow
# ---------------------------------------------------------------------------

def advance_stage(db: Session, task_id: int, stage_id: int, actor: User) -> Task:
    """Move a stage forward in the workflow."""
    task  = get_task_or_404(db, task_id)
    stage = get_stage_or_404(db, task_id, stage_id)

    role = actor.role

    # --- Staff transitions ---
    # If the user is the assignee of the stage, they must perform staff transitions
    if stage.assignee_id == actor.id and stage.status in (StageStatus.assigned, StageStatus.acknowledged, StageStatus.needs_revision):
        _assert_stage_access(actor, stage)
        transitions = {
            StageStatus.assigned:       StageStatus.acknowledged,
            StageStatus.acknowledged:   StageStatus.submitted,
            StageStatus.needs_revision: StageStatus.acknowledged,
        }
        next_status = transitions.get(stage.status)
        if next_status is None:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot advance stage from '{stage.status}' as assignee.",
            )
        stage.status = next_status

        if next_status == StageStatus.submitted:
            # Notify creator (admin/head)
            notify(
                db, task.creator_id, NotificationType.status_update,
                f"'{task.title}' — Stage {stage.order} ({stage.label}) has been submitted for review.",
                task_id=task.id,
            )
        else:
            notify(
                db, task.creator_id, NotificationType.status_update,
                f"'{task.title}' — Stage {stage.order} ({stage.label}) is now {next_status.value}.",
                task_id=task.id,
            )

    # --- Admin transitions ---
    elif role == UserRole.admin:
        if stage.status != StageStatus.submitted:
            raise HTTPException(
                status_code=400,
                detail="Admin can only advance stages that are in 'submitted' status.",
            )
        stage.status = StageStatus.checked

        # Notify EIC (super_admin)
        eic = db.query(User).filter(User.role == UserRole.super_admin).first()
        if eic:
            notify(
                db, eic.id, NotificationType.status_update,
                f"'{task.title}' — Stage {stage.order} ({stage.label}) is ready for your approval.",
                task_id=task.id,
            )

    # --- EIC (super_admin) transitions ---
    elif role == UserRole.super_admin:
        if stage.status not in (StageStatus.checked, StageStatus.submitted):
            raise HTTPException(
                status_code=400,
                detail="EIC can only approve stages that are in 'checked' or 'submitted' status.",
            )
        stage.status = StageStatus.approved

        # Check if there's a next stage
        all_stages = sorted(task.stages, key=lambda s: s.order)
        next_stage = next(
            (s for s in all_stages if s.order == stage.order + 1), None
        )

        if next_stage:
            # Unlock next stage
            next_stage.status = StageStatus.assigned
            notify(
                db, next_stage.assignee_id, NotificationType.task_assigned,
                f"Stage {next_stage.order} ({next_stage.label}) for '{task.title}' is now active — your turn!",
                task_id=task.id,
            )
        else:
            # All stages approved → publish task & auto-archive (FR-15)
            task.status = TaskStatus.published
            task.archived = True
            # Notify all stage assignees
            notified = set()
            for s in all_stages:
                if s.assignee_id not in notified:
                    notify(
                        db, s.assignee_id, NotificationType.status_update,
                        f"'{task.title}' has been fully approved and published! ✅",
                        task_id=task.id,
                    )
                    notified.add(s.assignee_id)
            # Notify creator too
            if task.creator_id not in notified:
                notify(
                    db, task.creator_id, NotificationType.status_update,
                    f"'{task.title}' has been published by the EIC. ✅",
                    task_id=task.id,
                )

    else:
        raise HTTPException(status_code=403, detail="Your role cannot advance stages.")

    # Sync overall task status (unless already published)
    if task.status != TaskStatus.published:
        task.status = _overall_status_from_stages(task.stages)

    db.commit()
    db.refresh(task)
    return task


def send_stage_back(db: Session, task_id: int, stage_id: int, actor: User, comment: str = "") -> Task:
    """Send a stage back for revision with a required comment."""
    task  = get_task_or_404(db, task_id)
    stage = get_stage_or_404(db, task_id, stage_id)

    role = actor.role

    if role == UserRole.admin:
        if stage.status != StageStatus.submitted:
            raise HTTPException(
                status_code=400,
                detail="Admin can only send back stages that are 'submitted'.",
            )
    elif role == UserRole.super_admin:
        if stage.status != StageStatus.checked:
            raise HTTPException(
                status_code=400,
                detail="EIC can only send back stages that are 'checked'.",
            )
    else:
        raise HTTPException(status_code=403, detail="Your role cannot send stages back.")

    stage.status = StageStatus.needs_revision

    message = (
        f"'{task.title}' — Stage {stage.order} ({stage.label}) needs revision from {actor.name}: {comment}"
        if comment.strip()
        else f"'{task.title}' — Stage {stage.order} ({stage.label}) needs revision. Please review and resubmit."
    )
    notify(db, stage.assignee_id, NotificationType.status_update, message, task_id=task.id)

    # Sync overall task status
    task.status = _overall_status_from_stages(task.stages)

    db.commit()
    db.refresh(task)
    return task


def poke_stage(db: Session, task_id: int, stage_id: int, poked_by: User) -> None:
    task  = get_task_or_404(db, task_id)
    stage = get_stage_or_404(db, task_id, stage_id)
    notify(
        db, stage.assignee_id, NotificationType.manual_poke,
        f"Reminder from {poked_by.name}: Please update your stage ({stage.label}) for '{task.title}'.",
        task_id=task.id,
    )
    db.commit()
