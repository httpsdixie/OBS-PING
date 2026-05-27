"""
Default module permissions per role — applied on account creation and role change.
EIC (super_admin) bypasses checks in User.has_permission(); no defaults stored.
"""
from app.models.user import UserRole, Permission

ROLE_DEFAULT_PERMISSIONS: dict[UserRole, list[str]] = {
    UserRole.admin: [
        Permission.view_all_tasks.value,
        Permission.view_directory.value,
        Permission.create_tasks.value,
        Permission.poke.value,
    ],
    UserRole.consultant: [
        Permission.view_all_tasks.value,
        Permission.view_directory.value,
    ],
    UserRole.staff: [],
    UserRole.super_admin: [],
}


def default_permissions_for_role(role: UserRole) -> list[str]:
    return list(ROLE_DEFAULT_PERMISSIONS.get(role, []))
