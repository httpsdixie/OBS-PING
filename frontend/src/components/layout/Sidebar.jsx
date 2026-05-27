/**
 * Sidebar — main navigation. Items shown depend on user role.
 * Audit Log opens as a modal; Notifications open as a drawer from TopBar.
 */
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSimpleMode } from "../../context/SimpleModeContext";
import { navLabel } from "../../constants/labels";
import { logout } from "../../services/authService";
import toast from "react-hot-toast";
import AuditModal from "../audit/AuditModal";
import PermissionsModal from "../permissions/PermissionsModal";
import ConfirmDialog from "../ui/ConfirmDialog";
import AccountModal from "../account/AccountModal";
import {
  ClipboardDocumentListIcon,
  ClipboardIcon,
  UsersIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  DocumentMagnifyingGlassIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";

const NAV_LINKS = [
  { to: "/dashboard", key: "dashboard", icon: HomeIcon,                    roles: ["super_admin","admin","consultant","staff"] },
  { to: "/tasks",     key: "tasks",     icon: ClipboardDocumentListIcon,   roles: ["super_admin","admin","consultant"] },
  { to: "/my-tasks",  key: "my_tasks",  icon: ClipboardIcon,               roles: ["staff"] },
  { to: "/directory", key: "directory", icon: UsersIcon,                   roles: ["super_admin","admin","consultant"] },
  { to: "/admin",     key: "admin",     icon: ShieldCheckIcon,             roles: ["super_admin"] },
];

export default function Sidebar({ onClose }) {
  const { user, canViewDir, canViewAudit, isSuperAdmin } = useAuth();
  const { simpleMode } = useSimpleMode();
  const [showAudit, setShowAudit]               = useState(false);
  const [showPermissions, setShowPermissions]   = useState(false);
  const [confirmLogout, setConfirmLogout]       = useState(false);
  const [showAccount, setShowAccount]           = useState(false);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully.");
    window.location.href = "/login";
  };

  const visibleLinks = NAV_LINKS.filter((n) => {
    if (!n.roles.includes(user?.role)) return false;
    if (n.to === "/directory") return canViewDir;
    return true;
  });

  return (
    <>
      <aside className="flex flex-col h-full bg-maroon-700 text-white w-64">
        {/* Brand */}
        <div className="px-6 py-5 border-b border-maroon-800">
          <p className="text-xl font-bold tracking-wide">OBS PING</p>
          <p className="text-xs text-maroon-200 mt-0.5">The Observer</p>
        </div>

        {/* User chip */}
        <button
          type="button"
          onClick={() => setShowAccount(true)}
          className="px-6 py-4 border-b border-maroon-800 text-left w-full hover:bg-maroon-800 transition-colors"
        >
          <p className="text-sm font-semibold truncate">{user?.name}</p>
          <p className="text-xs text-maroon-200 capitalize">{user?.role?.replace("_", " ")}</p>
          {user?.position && <p className="text-xs text-maroon-300 truncate">{user.position}</p>}
          <p className="text-xs text-maroon-300 mt-1"></p>
        </button>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleLinks.map(({ to, key, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                  isActive
                    ? "bg-white text-maroon-700"
                    : "text-maroon-100 hover:bg-maroon-800"
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {navLabel(key, simpleMode)}
            </NavLink>
          ))}

          {/* Audit Log — opens modal */}
          {canViewAudit && (
            <button
              onClick={() => { setShowAudit(true); onClose?.(); }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-maroon-100 hover:bg-maroon-800 transition-colors min-h-[44px]"
            >
              <DocumentMagnifyingGlassIcon className="w-5 h-5 flex-shrink-0" />
              {simpleMode ? "Activity log" : "Audit Log"}
            </button>
          )}

          {isSuperAdmin && (
            <button
              onClick={() => { setShowPermissions(true); onClose?.(); }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-maroon-100 hover:bg-maroon-800 transition-colors min-h-[44px]"
            >
              <KeyIcon className="w-5 h-5 flex-shrink-0" />
              {simpleMode ? "Who can do what" : "Permissions"}
            </button>
          )}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-maroon-800">
          <button
            onClick={() => setConfirmLogout(true)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-maroon-100 hover:bg-maroon-800 transition-colors min-h-[44px]"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {showAudit       && <AuditModal onClose={() => setShowAudit(false)} />}
      {showPermissions && <PermissionsModal onClose={() => setShowPermissions(false)} />}
      {showAccount     && <AccountModal onClose={() => setShowAccount(false)} />}

      {confirmLogout && (
        <ConfirmDialog
          title="Log Out"
          message="Are you sure you want to log out?"
          confirmLabel="Log Out"
          danger
          onConfirm={handleLogout}
          onClose={() => setConfirmLogout(false)}
        />
      )}
    </>
  );
}
