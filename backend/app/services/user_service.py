"""
User service — all business logic for directory management and EIC succession.
Routers call these functions; they never query the DB directly.
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User, UserRole, UserStatus
from app.constants.permissions import default_permissions_for_role
from app.core.security import hash_password, verify_password
from app.constants.positions import (
    EIC_POSITION,
    EDITORIAL_BOARD_POSITIONS,
    HEAD_TO_STAFF,
)
from app.schemas.user import UserCreate, UserAdminUpdate, UserSelfUpdate, UserPasswordChange
from app.services.audit_service import log_action


def _sync_position_for_role(user: User) -> str | None:
    """Align position when role changes (yearly board turnover). Returns audit note or None."""
    if user.role == UserRole.super_admin:
        if user.position != EIC_POSITION:
            user.position = EIC_POSITION
            return f"position→{EIC_POSITION}"
        return None

    if user.position == EIC_POSITION:
        user.position = None
        return "position→(cleared EIC title)"

    if user.role == UserRole.staff and user.position:
        if user.position in HEAD_TO_STAFF:
            new_pos = HEAD_TO_STAFF[user.position]
            user.position = new_pos
            return f"position→{new_pos}"
        if user.position in EDITORIAL_BOARD_POSITIONS:
            user.position = None
            return "position→(cleared board title)"

    return None


def combine_names(first: str, middle: str | None, last: str, ext: str | None) -> str:
    parts = [first]
    if middle:
        parts.append(middle)
    parts.append(last)
    if ext:
        parts.append(ext)
    return " ".join(p.strip() for p in parts if p and p.strip())


def create_user(db: Session, payload: UserCreate, created_by_id: int) -> User:
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered.")

    full_name = combine_names(
        payload.first_name,
        payload.middle_name,
        payload.last_name,
        payload.extension,
    )

    user = User(
        first_name=payload.first_name,
        middle_name=payload.middle_name,
        last_name=payload.last_name,
        extension=payload.extension,
        name=full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        position=payload.position,
    )
    user.permissions = default_permissions_for_role(payload.role)
    db.add(user)
    db.flush()  # get user.id before commit

    log_action(db, created_by_id, "ACCOUNT_CREATED", user.id, f"Created {user.email}")
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user_id: int, payload: UserAdminUpdate, updated_by_id: int) -> User:
    user = get_user_or_404(db, user_id)

    if payload.role == UserRole.super_admin:
        raise HTTPException(
            status_code=400,
            detail="Use the /users/succession endpoint to transfer EIC privileges.",
        )

    changes: list[str] = []
    if payload.position is not None:
        new_position = payload.position or None
        if new_position == EIC_POSITION and user.role != UserRole.super_admin:
            raise HTTPException(
                status_code=400,
                detail="Only the EIC can hold the Editor-in-Chief position. Use EIC Succession.",
            )
        if (
            new_position in EDITORIAL_BOARD_POSITIONS
            and user.role == UserRole.staff
        ):
            raise HTTPException(
                status_code=400,
                detail="Promote the member to Ed Board before assigning an editorial board position.",
            )
        user.position = new_position
        changes.append(f"position→{new_position or '(none)'}")
    if payload.role is not None:
        old_role = user.role
        user.role = payload.role
        changes.append(f"role→{payload.role}")
        pos_note = _sync_position_for_role(user)
        if pos_note:
            changes.append(pos_note)
        if payload.permissions is None and old_role != payload.role:
            user.permissions = default_permissions_for_role(payload.role)
            changes.append(f"permissions→defaults for {payload.role}")
    if payload.status is not None:
        user.status = payload.status
        changes.append(f"status→{payload.status}")
    if payload.permissions is not None:
        user.permissions = payload.permissions
        changes.append(f"permissions→{payload.permissions}")

    if changes:
        log_action(db, updated_by_id, "USER_UPDATED", user.id, "; ".join(changes))

    db.commit()
    db.refresh(user)
    return user


def update_self(db: Session, user: User, payload: UserSelfUpdate) -> User:
    changes: list[str] = []
    name_changed = False

    if payload.first_name is not None and user.first_name != payload.first_name:
        user.first_name = payload.first_name
        changes.append(f"first_name→{payload.first_name}")
        name_changed = True

    if payload.middle_name is not None and user.middle_name != payload.middle_name:
        user.middle_name = payload.middle_name
        changes.append(f"middle_name→{payload.middle_name or '(none)'}")
        name_changed = True

    if payload.last_name is not None and user.last_name != payload.last_name:
        user.last_name = payload.last_name
        changes.append(f"last_name→{payload.last_name}")
        name_changed = True

    if payload.extension is not None and user.extension != payload.extension:
        user.extension = payload.extension
        changes.append(f"extension→{payload.extension or '(none)'}")
        name_changed = True

    if name_changed:
        old_name = user.name
        new_name = combine_names(
            user.first_name or "",
            user.middle_name,
            user.last_name or "",
            user.extension,
        )
        if old_name != new_name:
            user.name = new_name
            changes.append(f"name→{new_name}")

    if payload.email is not None:
        new_email = payload.email.lower()
        if user.email != new_email:
            if db.query(User).filter(User.email == new_email, User.id != user.id).first():
                raise HTTPException(status_code=400, detail="Email already in use.")
            user.email = new_email
            changes.append(f"email→{new_email}")

    if changes:
        log_action(db, user.id, "PROFILE_UPDATED", user.id, "; ".join(changes))
        db.commit()
        db.refresh(user)
    return user


def change_password(db: Session, user: User, payload: UserPasswordChange) -> None:
    if not verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    if verify_password(payload.new_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="New password must be different from the current one.")
    user.hashed_password = hash_password(payload.new_password)
    log_action(db, user.id, "PASSWORD_CHANGED", user.id, "Password updated")
    db.commit()


def transfer_eic(
    db: Session,
    current_eic: User,
    new_eic_id: int,
    former_eic_position: str | None = None,
) -> User:
    """Demote current EIC to admin, promote successor, and sync position titles."""
    if new_eic_id == current_eic.id:
        raise HTTPException(status_code=400, detail="You are already the EIC.")

    new_eic = get_user_or_404(db, new_eic_id)
    if new_eic.status == UserStatus.deactivated:
        raise HTTPException(status_code=400, detail="Cannot transfer EIC to a deactivated user.")

    outgoing_name = current_eic.name
    incoming_name = new_eic.name
    old_incoming_position = new_eic.position

    current_eic.role = UserRole.admin
    current_eic.permissions = default_permissions_for_role(UserRole.admin)
    if former_eic_position:
        current_eic.position = former_eic_position
    elif current_eic.position == EIC_POSITION:
        current_eic.position = None

    new_eic.role = UserRole.super_admin
    new_eic.permissions = default_permissions_for_role(UserRole.super_admin)
    new_eic.position = EIC_POSITION

    details = (
        f"{outgoing_name} → admin"
        f"{f' ({current_eic.position})' if current_eic.position else ''}; "
        f"{incoming_name} → EIC"
        f"{f' (was {old_incoming_position})' if old_incoming_position else ''}"
    )
    log_action(db, current_eic.id, "EIC_TRANSFER", new_eic.id, details)

    db.commit()
    db.refresh(new_eic)
    return new_eic


def get_user_or_404(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return user
