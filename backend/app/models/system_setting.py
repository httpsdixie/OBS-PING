from sqlalchemy import Column, String, Boolean
from app.db.base import Base

class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String(50), primary_key=True, index=True)
    value_bool = Column(Boolean, default=False, nullable=False)
