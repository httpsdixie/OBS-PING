from sqlalchemy.orm import Session
from app.models.system_setting import SystemSetting

def get_setting_bool(db: Session, key: str, default: bool = False) -> bool:
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        return default
    return setting.value_bool

def set_setting_bool(db: Session, key: str, value: bool) -> None:
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        setting = SystemSetting(key=key, value_bool=value)
        db.add(setting)
    else:
        setting.value_bool = value
    db.commit()
