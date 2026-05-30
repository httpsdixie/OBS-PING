from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

from app.models.task import TaskStatus
from app.models.task_stage import StageStatus
from app.schemas.user import UserOut


# ---------------------------------------------------------------------------
# Stage schemas
# ---------------------------------------------------------------------------

class StageCreate(BaseModel):
    label: str          # "Writer", "Layout", etc.
    assignee_id: int


class TaskStageOut(BaseModel):
    id: int
    order: int
    label: str
    assignee_id: int
    assignee: Optional[UserOut] = None
    status: StageStatus
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Task schemas
# ---------------------------------------------------------------------------

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    event_tag: Optional[str] = None
    drive_link: Optional[str] = None
    deadline: datetime
    stages: List[StageCreate]


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    drive_link: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[TaskStatus] = None
    archived: Optional[bool] = None
    stages: Optional[List[StageCreate]] = None


class TaskOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    event_tag: Optional[str] = None
    drive_link: Optional[str] = None
    deadline: datetime
    status: TaskStatus
    creator_id: int
    archived: bool = False
    created_at: datetime
    updated_at: datetime
    stages: List[TaskStageOut] = []

    model_config = {"from_attributes": True}


class RevisionRequest(BaseModel):
    comment: str
