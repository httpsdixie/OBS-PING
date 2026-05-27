"""
Notification service — creates in-app notification records.
Centralises all notification creation so routers never touch the model directly.
"""
from sqlalchemy.orm import Session

from app.models.notification import Notification, NotificationType
from app.models.user import User
from app.services.email_service import send_notification_email


def send(
    db: Session,
    user_id: int,
    ntype: NotificationType,
    message: str,
    task_id: int | None = None,
) -> None:
    db.add(
        Notification(
            user_id=user_id,
            task_id=task_id,
            type=ntype,
            message=message,
        )
    )
    db.flush()

    user = db.query(User).filter(User.id == user_id).first()
    if user and user.email:
        subject = f"OBS PING — {ntype.value.replace('_', ' ').title()}"
        send_notification_email(user.email, subject, message)



def mark_read(db: Session, notif_id: int, user_id: int) -> bool:
    """Mark a single notification as read. Returns False if not found."""
    notif = (
        db.query(Notification)
        .filter(Notification.id == notif_id, Notification.user_id == user_id)
        .first()
    )
    if not notif:
        return False
    notif.is_read = True
    return True


def mark_all_read(db: Session, user_id: int) -> None:
    db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False,  # noqa: E712
    ).update({"is_read": True})
