/**
 * AdminCenterPage — Super Admin only (FR-02, FR-09, UC-03).
 * User list is the main view. Create Account and EIC Succession
 * open as modals rather than separate tabs.
 */
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useUsers } from "../hooks/useUsers";
import { useAuth } from "../context/AuthContext";
import { createUser, updateUser, transferEIC, getUser } from "../services/userService";
import { getMaintenanceStatus, toggleMaintenanceStatus } from "../services/authService";
import RoleBadge from "../components/ui/RoleBadge";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Spinner from "../components/ui/Spinner";
import Pagination from "../components/ui/Pagination";
import {
  MagnifyingGlassIcon,
  UserPlusIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";
import PositionSelect from "../components/users/PositionSelect";
import { EIC_POSITION } from "../constants/positions";

// All toggleable module permissions with labels
const MODULE_PERMISSIONS = [
  { key: "view_all_tasks", label: "View All Tasks",    desc: "See every task, not just their own" },
  { key: "view_directory", label: "View Directory",    desc: "Access the staff directory" },
  { key: "view_audit",     label: "View Audit Log",    desc: "Read the administrative audit trail" },
  { key: "create_tasks",   label: "Create Tasks",      desc: "Create and assign tasks to staff" },
  { key: "poke",           label: "Send Poke Reminders", desc: "Send manual reminders to assignees" },
];
const checkPasswordStrength = (pwd) => {
  const reqs = {
    length: pwd.length >= 8,
    upper: /[A-Z]/.test(pwd),
    lower: /[a-z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
  };
  const score = Object.values(reqs).filter(Boolean).length;
  let strength = "Very Weak";
  let color = "bg-red-500";
  let textColor = "text-red-500";
  if (score === 5) {
    strength = "Strong (Secure)";
    color = "bg-green-600";
    textColor = "text-green-600";
  } else if (score >= 3) {
    strength = "Good";
    color = "bg-yellow-500";
    textColor = "text-yellow-600";
  } else if (score >= 2) {
    strength = "Fair";
    color = "bg-orange-500";
    textColor = "text-orange-600";
  }
  return { reqs, score, strength, color, textColor };
};

// ── Create Account Modal ─────────────────────────────────────────────────────
function CreateAccountModal({ onCreated, onClose }) {
  const [form, setForm] = useState({
    first_name: "", middle_name: "", last_name: "", extension: "",
    email: "", password: "", role: "staff", position: "",
  });
  const [busy, setBusy] = useState(false);
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const passwordStrength = checkPasswordStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwordStrength.score < 5) {
      toast.error("Password must meet all security requirements.");
      return;
    }
    setBusy(true);
    try {
      const user = await createUser({
        first_name: form.first_name.trim(),
        middle_name: form.middle_name.trim() || null,
        last_name: form.last_name.trim(),
        extension: form.extension.trim() || null,
        email: form.email,
        password: form.password,
        role: form.role,
        position: form.position || null,
      });
      toast.success(`Account created for ${user.name}.`);
      onCreated(user);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail ?? "Failed to create account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Create New Account" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Input Row 1 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">First Name *</label>
            <input className="input" value={form.first_name} onChange={set("first_name")} required placeholder="e.g. Jane" />
          </div>
          <div>
            <label className="label">Middle Name</label>
            <input className="input" value={form.middle_name} onChange={set("middle_name")} placeholder="e.g. Smith" />
          </div>
        </div>

        {/* Name Input Row 2 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="label">Last Name *</label>
            <input className="input" value={form.last_name} onChange={set("last_name")} required placeholder="e.g. Doe" />
          </div>
          <div>
            <label className="label">Extension</label>
            <select className="input" value={form.extension} onChange={set("extension")}>
              <option value="">None</option>
              <option value="Jr.">Jr.</option>
              <option value="Sr.">Sr.</option>
              <option value="II">II</option>
              <option value="III">III</option>
              <option value="IV">IV</option>
              <option value="V">V</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Email *</label>
          <input
            className="input" type="email" value={form.email}
            onChange={set("email")} placeholder="member@evsu.edu.ph" required
          />
        </div>
        <div>
          <label className="label">Password *</label>
          <input className="input" type="password" value={form.password} onChange={set("password")} required placeholder="••••••••" />
          {form.password && (
            <div className="mt-2 space-y-1.5 p-3 bg-gray-50 rounded-xl border border-gray-100 transition-all duration-300">
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full ${passwordStrength.color} transition-all duration-300`} style={{ width: `${(passwordStrength.score / 5) * 100}%` }}></div>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-gray-600">Password Strength:</span>
                <span className={passwordStrength.textColor}>{passwordStrength.strength}</span>
              </div>
              <ul className="text-[11px] grid grid-cols-2 gap-x-2 gap-y-1 text-gray-500 pt-1 border-t border-gray-200/50 mt-1">
                <li className="flex items-center gap-1">
                  <span className={passwordStrength.reqs.length ? "text-green-600 font-bold" : "text-gray-300"}>
                    {passwordStrength.reqs.length ? "✓" : "○"}
                  </span>
                  <span className={passwordStrength.reqs.length ? "text-gray-700 font-medium" : ""}>Min 8 characters</span>
                </li>
                <li className="flex items-center gap-1">
                  <span className={passwordStrength.reqs.upper ? "text-green-600 font-bold" : "text-gray-300"}>
                    {passwordStrength.reqs.upper ? "✓" : "○"}
                  </span>
                  <span className={passwordStrength.reqs.upper ? "text-gray-700 font-medium" : ""}>Uppercase (A-Z)</span>
                </li>
                <li className="flex items-center gap-1">
                  <span className={passwordStrength.reqs.lower ? "text-green-600 font-bold" : "text-gray-300"}>
                    {passwordStrength.reqs.lower ? "✓" : "○"}
                  </span>
                  <span className={passwordStrength.reqs.lower ? "text-gray-700 font-medium" : ""}>Lowercase (a-z)</span>
                </li>
                <li className="flex items-center gap-1">
                  <span className={passwordStrength.reqs.number ? "text-green-600 font-bold" : "text-gray-300"}>
                    {passwordStrength.reqs.number ? "✓" : "○"}
                  </span>
                  <span className={passwordStrength.reqs.number ? "text-gray-700 font-medium" : ""}>Number (0-9)</span>
                </li>
                <li className="flex items-center gap-1 col-span-2">
                  <span className={passwordStrength.reqs.special ? "text-green-600 font-bold" : "text-gray-300"}>
                    {passwordStrength.reqs.special ? "✓" : "○"}
                  </span>
                  <span className={passwordStrength.reqs.special ? "text-gray-700 font-medium" : ""}>Special char (!@#$...)</span>
                </li>
              </ul>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Role *</label>
            <select className="input" value={form.role} onChange={set("role")}>
              <option value="staff">Staff</option>
              <option value="admin">Ed Board (Admin)</option>
              <option value="consultant">Consultant</option>
            </select>
          </div>
          <div>
            <label className="label">Position Title</label>
            <PositionSelect value={form.position} onChange={set("position")} />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Creating…" : "Create Account"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── EIC Succession Modal ─────────────────────────────────────────────────────
function SuccessionModal({ onClose }) {
  const { user: currentUser } = useAuth();
  const { users } = useUsers({ status: "active" });
  const [selectedId, setSelectedId] = useState("");
  const [formerPosition, setFormerPosition] = useState(
    currentUser?.position === EIC_POSITION ? "" : (currentUser?.position ?? ""),
  );
  const [confirm, setConfirm]       = useState(false);
  const [busy, setBusy]             = useState(false);

  const candidates = users.filter((u) => u.id !== currentUser?.id);
  const target     = candidates.find((u) => u.id === Number(selectedId));

  const handleTransfer = async () => {
    setBusy(true);
    try {
      await transferEIC(Number(selectedId), formerPosition || null);
      toast.success("EIC role transferred. You have been demoted to Admin.");
      localStorage.removeItem("token");
      window.location.href = "/login";
    } catch (err) {
      toast.error(err.response?.data?.detail ?? "Transfer failed.");
      setBusy(false);
    }
  };

  return (
    <Modal title="EIC Succession" onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          <strong>⚠️ Warning:</strong> This is irreversible. You will immediately lose
          Super Admin privileges and be redirected to login.
        </div>

        <div>
          <label className="label">Transfer EIC role to *</label>
          <select
            className="input"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">— Choose a member —</option>
            {candidates.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}{u.position ? ` (${u.position})` : ` — ${u.role}`}
              </option>
            ))}
          </select>
          {target && (
            <p className="text-xs text-gray-500 mt-1">
              {target.name} will become <strong>{EIC_POSITION}</strong>
              {target.position ? ` (replacing ${target.position})` : ""}.
            </p>
          )}
        </div>

        <div>
          <label className="label">Your new position after transfer</label>
          <PositionSelect
            value={formerPosition}
            onChange={(e) => setFormerPosition(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">
            You will be demoted to Ed Board. Pick your new title (e.g. Head Layout Artist), or leave blank.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-danger"
            disabled={!selectedId || busy}
            onClick={() => setConfirm(true)}
          >
            Transfer EIC Role
          </button>
        </div>
      </div>

      {confirm && target && (
        <ConfirmDialog
          title="Confirm EIC Transfer"
          message={`Transfer ${EIC_POSITION} to ${target.name}. You become Ed Board${formerPosition ? ` as ${formerPosition}` : ""}. This cannot be undone.`}
          confirmLabel="Yes, Transfer Now"
          danger
          onConfirm={handleTransfer}
          onClose={() => setConfirm(false)}
        />
      )}
    </Modal>
  );
}

// ── Edit User Modal ──────────────────────────────────────────────────────────
function EditUserModal({ user, onSaved, onClose }) {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getUser(user.id)
      .then((fresh) => {
        if (cancelled) return;
        setProfile({ name: fresh.name, email: fresh.email });
        setForm({
          position: fresh.position ?? "",
          role: fresh.role,
          status: fresh.status,
          permissions: fresh.permissions ?? [],
        });
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Failed to load account details.");
          onClose();
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user.id, onClose]);
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const togglePerm = (key) => {
    setForm((p) => ({
      ...p,
      permissions: p.permissions.includes(key)
        ? p.permissions.filter((k) => k !== key)
        : [...p.permissions, key],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const updated = await updateUser(user.id, {
        position: form.position || null,
        role: form.role,
        status: form.status,
        permissions: form.permissions,
      });
      toast.success("User updated.");
      onSaved(updated);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail ?? "Failed to update user.");
    } finally {
      setBusy(false);
    }
  };

  if (loading || !form || !profile) {
    return (
      <Modal title={`Edit — ${user.name}`} onClose={onClose}>
        <div className="flex justify-center py-12"><Spinner /></div>
      </Modal>
    );
  }

  const isEIC = form.role === "super_admin";

  return (
    <Modal title={`Edit — ${profile.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Full Name</label>
          <input className="input bg-gray-50 text-gray-600 cursor-not-allowed" value={profile.name} readOnly disabled />
          <p className="text-xs text-gray-400 mt-1">Only the member can change their name from their profile.</p>
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input bg-gray-50 text-gray-600 cursor-not-allowed" value={profile.email} readOnly disabled />
          <p className="text-xs text-gray-400 mt-1">Only the member can change their email from their profile.</p>
        </div>
        <div>
          <label className="label">Position Title</label>
          <PositionSelect value={form.position} onChange={set("position")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={set("role")}>
              <option value="staff">Staff</option>
              <option value="admin">Ed Board (Admin)</option>
              <option value="consultant">Consultant</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">Use EIC Succession to transfer EIC role.</p>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={set("status")}>
              <option value="active">Active</option>
              <option value="deactivated">Deactivated</option>
            </select>
          </div>
        </div>

        {/* Per-user module permissions — EIC has all access by role */}
        {!isEIC && (
          <div>
            <label className="label">Module Permissions</label>
            <p className="text-xs text-gray-400 mb-2">
              Grant module access here or from the Permissions sidebar menu. Changes sync both places.
            </p>
            <div className="space-y-2 rounded-lg border border-gray-200 p-3">
              {MODULE_PERMISSIONS.map(({ key, label, desc }) => (
                <label key={key} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form.permissions.includes(key)}
                    onChange={() => togglePerm(key)}
                    className="mt-0.5 rounded accent-maroon-700"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800 group-hover:text-maroon-700">
                      {label}
                    </p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {isEIC && (
          <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
            EIC has all module permissions by default.
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AdminCenterPage() {
  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [page, setPage]             = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [showSuccession, setShowSuccession] = useState(false);
  const [editing, setEditing]       = useState(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [toggling, setToggling]     = useState(false);

  useEffect(() => {
    getMaintenanceStatus().then((data) => setMaintenanceMode(data.maintenance_mode));
  }, []);

  const handleToggleMaintenance = async () => {
    setToggling(true);
    const nextState = !maintenanceMode;
    try {
      await toggleMaintenanceStatus(nextState);
      setMaintenanceMode(nextState);
      toast.success(
        nextState
          ? "Maintenance Mode is now ENABLED. Non-EIC members are locked out."
          : "Maintenance Mode is now DISABLED. All systems online."
      );
    } catch (err) {
      toast.error("Failed to toggle maintenance mode.");
    } finally {
      setToggling(false);
    }
  };

  const PAGE_SIZE = 10;

  const params = { search };
  if (roleFilter)      params.role   = roleFilter;
  if (showDeactivated) params.status = "deactivated";
  else                 params.status = "active";

  const { users, setUsers, loading } = useUsers(params);

  const totalPages = Math.ceil(users.length / PAGE_SIZE);
  const paginated  = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };
  const handleRole   = (e) => { setRoleFilter(e.target.value); setPage(1); };
  const handleCreated = (newUser) => { setUsers((prev) => [newUser, ...prev]); setPage(1); };
  const handleSaved   = (updated) =>
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Center</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage staff accounts and EIC succession.</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => setShowSuccession(true)} className="btn-secondary flex items-center gap-2 text-sm">
            <ArrowsRightLeftIcon className="w-4 h-4" /> EIC Succession
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm">
            <UserPlusIcon className="w-4 h-4" /> Create Account
          </button>
        </div>
      </div>

      {/* Maintenance Mode Alert & Toggle Card */}
      <div className={`card border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${
        maintenanceMode 
          ? "border-red-300 bg-red-50/50 shadow-md ring-1 ring-red-300" 
          : "border-slate-200 bg-slate-50/50"
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${maintenanceMode ? "bg-red-600 animate-pulse" : "bg-green-600"}`}></span>
            <h3 className="font-bold text-gray-900 text-sm md:text-base">
              {maintenanceMode ? "System Under Maintenance" : "System Maintenance Protection"}
            </h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed max-w-2xl">
            {maintenanceMode 
              ? "All staff and standard editor accounts are currently locked out with a polite construction page. Toggle off to bring ObsPing back online." 
              : "Enable this to safely lock staff out while you perform role succession, database upgrades, or manual data backups."}
          </p>
        </div>
        <button
          onClick={handleToggleMaintenance}
          disabled={toggling}
          className={`flex-shrink-0 min-h-[44px] px-5 py-2.5 rounded-xl font-semibold text-xs md:text-sm transition-all duration-200 active:scale-[0.98] ${
            maintenanceMode
              ? "btn-danger shadow-md shadow-red-950/20"
              : "btn-secondary text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
          }`}
        >
          {toggling ? "Saving..." : maintenanceMode ? "Turn Off Maintenance" : "Turn On Maintenance"}
        </button>
      </div>

      {/* Search + role filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search by name or email…" value={search} onChange={handleSearch} />
        </div>
        <select className="input sm:w-44" value={roleFilter} onChange={handleRole}>
          <option value="">All Roles</option>
          <option value="super_admin">EIC</option>
          <option value="admin">Ed Board</option>
          <option value="consultant">Consultant</option>
          <option value="staff">Staff</option>
        </select>
        <button
          onClick={() => { setShowDeactivated((v) => !v); setPage(1); }}
          className={`btn-secondary text-sm flex-shrink-0 ${showDeactivated ? "bg-red-50 border-red-300 text-red-700" : ""}`}
        >
          {showDeactivated ? "Showing Deactivated" : "Deactivated"}
        </button>
      </div>

      {/* User list */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : users.length === 0 ? (
        <p className="text-center text-gray-400 py-20">No members found.</p>
      ) : (
        <>
          <div className="space-y-2">
            {paginated.map((u) => (
              <div key={u.id} className="card flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-maroon-700 text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  {u.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{u.name}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  {u.position && <p className="text-xs text-gray-500">{u.position}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <RoleBadge role={u.role} />
                  <span className={`badge text-xs ${u.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {u.status}
                  </span>
                  {u.role !== "super_admin" && (
                    <button className="btn-secondary text-xs px-3 min-h-[44px]" onClick={() => setEditing(u)}>
                      Edit
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      {showCreate     && <CreateAccountModal onCreated={handleCreated} onClose={() => setShowCreate(false)} />}
      {showSuccession && <SuccessionModal onClose={() => setShowSuccession(false)} />}
      {editing        && <EditUserModal user={editing} onSaved={handleSaved} onClose={() => setEditing(null)} />}
    </div>
  );
}
