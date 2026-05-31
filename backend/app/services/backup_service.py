"""
Backup service — implements automated, safe SQLite online database hot backups (NFR-09).
Provides safe replication of obs_ping.db file and rotates logs daily (30-day retention).
"""
import os
import shutil
import sqlite3
from datetime import datetime, timezone, timedelta
from app.core.config import settings
from app.services.audit_service import log_action

def perform_db_backup(db_session=None) -> str | None:
    """
    Performs a safe SQLite online hot backup of the obs_ping.db file.
    Does not block active read/write transactions. Saves copy to backups/ directory.
    """
    db_url = settings.DATABASE_URL
    if not db_url.startswith("sqlite:///"):
        # If database is not SQLite, skip file copy backups
        return None

    # Resolve absolute path to the database file
    db_path = db_url.replace("sqlite:///", "")
    if not os.path.isabs(db_path):
        db_path = os.path.abspath(db_path)

    if not os.path.exists(db_path):
        return None

    # Create backups/ directory relative to database file
    db_dir = os.path.dirname(db_path)
    backups_dir = os.path.join(db_dir, "backups")
    os.makedirs(backups_dir, exist_ok=True)

    # Generate timestamped filename using Philippine Time (UTC+8)
    pht_tz = timezone(timedelta(hours=8))
    timestamp = datetime.now(timezone.utc).astimezone(pht_tz).strftime("%Y%m%d_%H%M%S")
    backup_filename = f"obs_ping_backup_{timestamp}.db"
    backup_path = os.path.join(backups_dir, backup_filename)

    # SQLite built-in online backup API — copies pages safely during live operations
    src_conn = sqlite3.connect(db_path)
    dest_conn = sqlite3.connect(backup_path)
    try:
        with dest_conn:
            src_conn.backup(dest_conn)
    finally:
        src_conn.close()
        dest_conn.close()

    # Log action to audit logs if a db session is provided (scheduled task passes None)
    if db_session:
        log_action(
            db_session, 
            admin_id=1,  # system ID
            action="DB_BACKUP_COMPLETED", 
            target_id=None, 
            details=f"Database backed up successfully to: backups/{backup_filename}"
        )

    # Clear backups older than 30 days (PHT retention policy)
    clean_old_backups(backups_dir, max_days=30)

    return backup_path

def clean_old_backups(backups_dir: str, max_days: int = 30) -> None:
    """Deletes backup files older than configured max_days."""
    import time
    now = time.time()
    cutoff = now - (max_days * 86400) # days to seconds

    for filename in os.listdir(backups_dir):
        if not filename.startswith("obs_ping_backup_") or not filename.endswith(".db"):
            continue
        file_path = os.path.join(backups_dir, filename)
        if os.path.isfile(file_path):
            file_mtime = os.path.getmtime(file_path)
            if file_mtime < cutoff:
                try:
                    os.remove(file_path)
                except OSError:
                    pass
