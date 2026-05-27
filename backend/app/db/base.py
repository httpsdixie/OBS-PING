"""
Declarative base shared by all models.
Import Base here; never import it from individual model files.
"""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
