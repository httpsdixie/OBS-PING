/**
 * PermissionsModal — manage per-user module permissions from one place.
 * Super Admin only. Opens from the sidebar nav.
 */
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import Spinner from "../ui/Spinner";
import Pagination from "../ui/Pagination";
import RoleBadge from "../ui/RoleBadge";
import { useUsers } from "../../hooks/useUsers";
import { updateUser } from "../../services/userService";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

const MODULE_PERMISSIONS = [
  { key: "view_all_tasks", label: "View All Tasks",      desc: "See every task, not just their own" },
  { key: "view_directory", label: "View Directory",      desc: "Access the staff directory" },
  { key: "view_audit",     label: "View Audit Log",      desc: "Read the administrative audit trail" },
  { key: "create_tasks",   label: "Create Tasks",        desc: "Create and assign tasks to staff" },
  { key: "poke",           label: "Send Poke Reminders", desc: "Send manual reminders to assignees" },
];

// ── Single user permission row ───────────────────────────────────────────────
function UserPermRow({ user, onSaved }) {
  const isEIC = user.role === "super_admin";
  const [perms, setPerms]   = useState(user.permissions ?? []);
  const [saving, setSaving] = useState(null); // key of perm being saved

  useEffect(() => {
    setPerms(user.permissions ?? []);
  }, [user.id, user.permissions]);

  const toggle = async (key) => {
    const next = perms.includes(key)
      ? perms.filter((k) => k !== key)
      : [...perms, key];

    setSaving(key);
    try {
      const updated = await updateUser(user.id, { permissions: next });
      setPerms(updated.permissions);
      onSaved(updated);
      toast.success(`Permission updated for ${user.name.split(" ")[0]}.`);
    } catch {
      toast.error("Failed to update permission.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="card space-y-3">
      {/* User header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-maroon-700 text-white flex items-center justify-center font-semibold text-xs flex-shrink-0">
          {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{user.name}</p>
          {user.position && <p className="text-xs text-gray-400">{user.position}</p>}
        </div>
        <RoleBadge role={user.role} />
      </div>

      {/* Permission toggles */}
      {isEIC ? (
        <p className="text-xs text-gray-400 italic">
          EIC — all permissions granted by default.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {MODULE_PERMISSIONS.map(({ key, label }) => {
            const checked = perms.includes(key);
            const busy    = saving === key;
            return (
              <label
                key={key}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                  checked
                    ? "bg-maroon-50 border-maroon-300 text-maroon-800"
                    : "bg-gray-50 border-gray-200 text-gray-600"
                } ${busy ? "opacity-50 pointer-events-none" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(key)}
                  className="accent-maroon-700 rounded"
                  disabled={busy}
                />
                <span className="text-xs font-medium">{label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Modal ───────────────────────────────────────────────────────────────
export default function PermissionsModal({ onClose }) {
  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage]             = useState(1);
  const PAGE_SIZE = 5;

  const { users, setUsers, loading } = useUsers({ search, role: roleFilter || undefined });

  const totalPages = Math.ceil(users.length / PAGE_SIZE);
  const paginated  = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSaved = (updated) =>
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));

  return (
    <Modal title="Module Permissions" onClose={onClose}>
      <p className="text-xs text-gray-500 mb-4">
        Grant or revoke module access per user. Changes take effect immediately.
      </p>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9 text-sm"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="input w-36 text-sm"
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Roles</option>
          <option value="staff">Staff</option>
          <option value="consultant">Consultant</option>
          <option value="admin">Ed Board</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : users.length === 0 ? (
        <p className="text-center text-gray-400 py-10 text-sm">No members found.</p>
      ) : (
        <>
          <div className="space-y-3">
            {paginated.map((u) => (
              <UserPermRow key={u.id} user={u} onSaved={handleSaved} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </Modal>
  );
}
