"""
FastAPI dependency functions for authentication and role-based access control.
These wrap the pure security utilities in app.core.security with HTTP concerns.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User, UserRole, UserStatus

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Resolve the JWT token to a live, active User row."""
    user_id = decode_access_token(token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.id == user_id).first()
    if user is None or user.status == UserStatus.deactivated:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or deactivated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Global maintenance mode check — blocks all non-EIC users
    from app.services.system_setting_service import get_setting_bool
    if get_setting_bool(db, "maintenance_mode", default=False) and user.role != UserRole.super_admin:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="System is under maintenance. Please try again later.",
        )

    return user


def require_roles(*roles: UserRole):
    """
    Dependency factory — restricts an endpoint to one or more roles.

    Usage:
        current_user: User = Depends(require_roles(UserRole.super_admin))
    """
    def _guard(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user
    return _guard
