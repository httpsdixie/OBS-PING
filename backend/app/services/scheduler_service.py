"""
Scheduler service — background jobs.

Jobs:
1. Weekend reminders  — every Saturday 9AM, notify all staff with pending tasks.
2. Deadline reminders — every day 9AM, notify assignees whose deadline is in ≤2 days.
"""
from datetime import datetime, timezone, timedelta

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.db.session import SessionLocal
from app.models.task import Task, TaskStatus
from app.models.notification import NotificationType
from app.services.notification_service import send as notify

_PENDING_STATUSES = {TaskStatus.assigned, TaskStatus.acknowledged, TaskStatus.needs_revision}


def _send_weekend_reminders() -> None:
    """Every Saturday 9AM — remind all staff with still-pending tasks."""
    db = SessionLocal()
    try:
        tasks = (
            db.query(Task)
            .filter(Task.status.in_(_PENDING_STATUSES), Task.assignee_id.isnot(None))
            .all()
        )
        for task in tasks:
            notify(
                db, task.assignee_id, NotificationType.automated_weekend,
                f"Weekend reminder: '{task.title}' is still pending. Please update your status.",
                task_id=task.id,
            )
        db.commit()
    finally:
        db.close()


def _send_deadline_reminders() -> None:
    """
    Every day 9AM — notify assignees whose deadline is within the next 2 days
    and whose task is still in a pending status.
    Only fires once per task (checks if a deadline_reminder was already sent today).
    """
    db = SessionLocal()
    try:
        now      = datetime.now(timezone.utc)
        in_2days = now + timedelta(days=2)

        tasks = (
            db.query(Task)
            .filter(
                Task.status.in_(_PENDING_STATUSES),
                Task.assignee_id.isnot(None),
                Task.deadline >= now,
                Task.deadline <= in_2days,
            )
            .all()
        )

        from app.models.notification import Notification
        for task in tasks:
            # Avoid duplicate: skip if already sent a deadline_reminder today
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            already = (
                db.query(Notification)
                .filter(
                    Notification.task_id == task.id,
                    Notification.user_id == task.assignee_id,
                    Notification.type == NotificationType.deadline_reminder,
                    Notification.sent_at >= today_start,
                )
                .first()
            )
            if already:
                continue

            hours_left = int((task.deadline - now).total_seconds() / 3600)
            time_label = f"{hours_left} hours" if hours_left < 24 else "2 days"

            notify(
                db, task.assignee_id, NotificationType.deadline_reminder,
                f"⏰ Deadline in {time_label}: '{task.title}'. Please submit soon.",
                task_id=task.id,
            )

        db.commit()
    finally:
        db.close()


def start_scheduler() -> BackgroundScheduler:
    scheduler = BackgroundScheduler()

    scheduler.add_job(
        _send_weekend_reminders,
        trigger=CronTrigger(day_of_week="sat", hour=9, minute=0),
        id="weekend_reminders",
        replace_existing=True,
    )

    scheduler.add_job(
        _send_deadline_reminders,
        trigger=CronTrigger(hour=9, minute=0),   # every day at 9AM
        id="deadline_reminders",
        replace_existing=True,
    )

    scheduler.start()
    return scheduler
