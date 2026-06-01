"""
Clear Tasks script — clears all tasks, notifications, audits, and OTPs,
leaving all user accounts fully intact.
"""
import sys
import os

# Add the parent directory of backend/app to path to resolve imports correctly when running standalone
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.models.user import User
from app.models.task import Task
from app.models.notification import Notification
from app.models.audit_log import AuditLog
from app.models.otp import OtpCode

db = SessionLocal()
try:
    print("Clearing task-related database tables...")
    
    deleted_notifications = db.query(Notification).delete()
    deleted_tasks = db.query(Task).delete()
    deleted_audits = db.query(AuditLog).delete()
    deleted_otps = db.query(OtpCode).delete()
    
    print(f"  Deleted {deleted_notifications} notifications.")
    print(f"  Deleted {deleted_tasks} tasks.")
    print(f"  Deleted {deleted_audits} audits.")
    print(f"  Deleted {deleted_otps} OTP records.")
    
    user_count = db.query(User).count()
    print(f"  Preserved all {user_count} user accounts successfully.")
    
    db.commit()
    print("Database task records are now clean and ready for real-world use!")
except Exception as e:
    print(f"Error purging tasks: {e}")
    db.rollback()
finally:
    db.close()
