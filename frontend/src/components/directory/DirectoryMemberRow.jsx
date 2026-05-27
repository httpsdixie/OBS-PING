import { useState } from "react";
import toast from "react-hot-toast";
import RoleBadge from "../ui/RoleBadge";
import PositionSelect from "../users/PositionSelect";
import { updateUser } from "../../services/userService";
import { EIC_POSITION } from "../../constants/positions";

const STATUS_STYLES = {
  active: "bg-green-100 text-green-700",
  deactivated: "bg-red-100 text-red-600",
};

const ROLE_OPTIONS = [
  { value: "staff", label: "Staff" },
  { value: "admin", label: "Ed Board" },
  { value: "consultant", label: "Consultant" },
];

export default function DirectoryMemberRow({ user, editable, onUpdated }) {
  const [saving, setSaving] = useState(false);
  const isEIC = user.role === "super_admin";

  const save = async (payload) => {
    setSaving(true);
    try {
      const updated = await updateUser(user.id, payload);
      onUpdated(updated);
      toast.success(`Updated ${user.name.split(" ")[0]}.`);
    } catch (err) {
      toast.error(err.response?.data?.detail ?? "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`card flex flex-col sm:flex-row sm:items-center gap-4 ${saving ? "opacity-60" : ""}`}>
      <div className="w-10 h-10 rounded-full bg-maroon-700 text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
        {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{user.name}</p>
        <p className="text-xs text-gray-400 truncate">{user.email}</p>
      </div>

      <div className="flex flex-col sm:items-end gap-2 min-w-[180px]">
        {editable && !isEIC ? (
          <>
            <PositionSelect
              value={user.position ?? ""}
              onChange={(e) => save({ position: e.target.value || null })}
              disabled={saving}
              className="input text-xs py-1.5"
            />
            <select
              className="input text-xs py-1.5"
              value={user.role}
              onChange={(e) => save({ role: e.target.value })}
              disabled={saving}
            >
              {ROLE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </>
        ) : (
          <>
            <p className="text-xs text-gray-500 text-right">{user.position || "—"}</p>
            <RoleBadge role={user.role} />
          </>
        )}
        {isEIC && editable && (
          <p className="text-xs text-maroon-600 text-right">{EIC_POSITION}</p>
        )}
        <span className={`badge text-xs self-end ${STATUS_STYLES[user.status]}`}>
          {user.status}
        </span>
      </div>
    </div>
  );
}
