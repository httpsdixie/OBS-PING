from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class AuditLogOut(BaseModel):
    id: int
    admin_id: int
    action: str
    affected_user_id: Optional[int]
    detail: Optional[str]
    timestamp: datetime

    model_config = {"from_attributes": True}
