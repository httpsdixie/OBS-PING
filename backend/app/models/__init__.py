# Re-export all models so Alembic and create_all() can discover them
from app.models.user import User, UserRole, UserStatus                      # noqa: F401
from app.models.task import Task, TaskStatus                                # noqa: F401
from app.models.task_stage import TaskStage, StageStatus                    # noqa: F401
from app.models.notification import Notification, NotificationType          # noqa: F401
from app.models.audit_log import AuditLog                                   # noqa: F401
from app.models.otp import OtpCode, OtpPurpose                              # noqa: F401
from app.models.system_setting import SystemSetting                        # noqa: F401
