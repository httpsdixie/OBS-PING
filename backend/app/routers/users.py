"""
Users router — directory management and EIC succession endpoints.
Business logic is delegated to app.services.user_service.
Permission checks honour both role-based AND per-user module permissions.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, UserRole, UserStatus, Permission
from app.schemas.user import (
    UserCreate,
    UserAdminUpdate,
    UserSelfUpdate,
    UserPasswordChange,
    UserOut,
    SuccessionRequest,
)
from app.dependencies.auth import get_current_user, require_roles
from app.constants.positions import EIC_POSITION
from app.services import user_service

router = APIRouter(prefix="/users", tags=["Users"])

_SUPER_ADMIN_ONLY = require_roles(UserRole.super_admin)


@router.post("/", response_model=UserOut, status_code=201)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_SUPER_ADMIN_ONLY),
):
    return user_service.create_user(db, payload, created_by_id=current_user.id)


@router.get("/me", response_model=UserOut)
def get_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Self-heal stale titles after EIC succession (role updated before positions were synced)
    if current_user.role == UserRole.super_admin and current_user.position != EIC_POSITION:
        current_user.position = EIC_POSITION
        db.commit()
        db.refresh(current_user)
    elif current_user.role != UserRole.super_admin and current_user.position == EIC_POSITION:
        current_user.position = None
        db.commit()
        db.refresh(current_user)
    return current_user


@router.patch("/me", response_model=UserOut)
def update_me(
    payload: UserSelfUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return user_service.update_self(db, current_user, payload)


@router.post("/me/password", status_code=204)
def change_password(
    payload: UserPasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_service.change_password(db, current_user, payload)


@router.get("/", response_model=List[UserOut])
def list_users(
    search: Optional[str] = Query(None, description="Search by name or email"),
    role: Optional[UserRole] = None,
    status: Optional[UserStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Require view_directory permission (admins have it by default)
    if not current_user.has_permission(Permission.view_directory):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )
    q = db.query(User)
    if search:
        q = q.filter(
            (User.name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%"))
        )
    if role:
        q = q.filter(User.role == role)
    if status:
        q = q.filter(User.status == status)
    return q.order_by(User.name).all()


@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_id != current_user.id and not current_user.has_permission(Permission.view_directory):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )
    return user_service.get_user_or_404(db, user_id)


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserAdminUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_SUPER_ADMIN_ONLY),
):
    return user_service.update_user(db, user_id, payload, updated_by_id=current_user.id)


@router.post("/succession", response_model=UserOut)
def transfer_eic(
    payload: SuccessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(_SUPER_ADMIN_ONLY),
):
    return user_service.transfer_eic(
        db,
        current_user,
        payload.new_eic_user_id,
        former_eic_position=payload.former_eic_position,
    )
