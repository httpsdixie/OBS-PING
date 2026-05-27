from typing import Optional
from datetime import datetime
from pydantic import BaseModel

from app.models.notification import NotificationType


class NotificationOut(BaseModel):
    id: int
    task_id: Optional[int]
    user_id: int
    type: NotificationType
    message: Optional[str]
    is_read: bool
    sent_at: datetime

    model_config = {"from_attributes": True}
