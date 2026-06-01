/**
 * AccountModal — members edit name, email, and password.
 */
import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import { useAuth } from "../../context/AuthContext";
import { updateMe, changePassword } from "../../services/userService";

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

export default function AccountModal({ onClose }) {
  const { user, setUser } = useAuth();
  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [middleName, setMiddleName] = useState(user?.middle_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [extension, setExtension] = useState(user?.extension ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const wantsPasswordChange =
    currentPassword || newPassword || confirmPassword;

  const newPasswordStrength = checkPasswordStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedFirst = firstName.trim();
    const trimmedMiddle = middleName.trim();
    const trimmedLast = lastName.trim();
    const trimmedExt = extension.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedFirst) {
      toast.error("First name cannot be empty.");
      return;
    }
    if (!trimmedLast) {
      toast.error("Last name cannot be empty.");
      return;
    }
    if (!trimmedEmail) {
      toast.error("Email cannot be empty.");
      return;
    }

    if (wantsPasswordChange) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        toast.error("Fill in all password fields to change your password.");
        return;
      }
      if (newPasswordStrength.score < 5) {
        toast.error("New password must meet all security requirements.");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("New passwords do not match.");
        return;
      }
    }

    setBusy(true);
    try {
      const updated = await updateMe({
        first_name: trimmedFirst,
        middle_name: trimmedMiddle || null,
        last_name: trimmedLast,
        extension: trimmedExt || null,
        email: trimmedEmail,
      });
      setUser(updated);

      if (wantsPasswordChange) {
        await changePassword({
          current_password: currentPassword,
          new_password: newPassword,
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }

      toast.success(wantsPasswordChange ? "Profile and password updated." : "Profile updated.");
      onClose();
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map((d) => d.msg ?? d).join(", ")
        : detail ?? "Failed to update profile.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="My Profile" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Fields Row 1 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">First Name *</label>
            <input
              className="input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              placeholder="First Name"
            />
          </div>
          <div>
            <label className="label">Middle Name</label>
            <input
              className="input"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              placeholder="Middle Name"
            />
          </div>
        </div>

        {/* Name Fields Row 2 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="label">Last Name *</label>
            <input
              className="input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              placeholder="Last Name"
            />
          </div>
          <div>
            <label className="label">Extension</label>
            <select
              className="input"
              value={extension}
              onChange={(e) => setExtension(e.target.value)}
            >
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
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@observer.evsu.edu.ph"
            required
            autoComplete="email"
          />
        </div>

        <div className="border-t border-gray-200 pt-4 space-y-3">
          <p className="text-sm font-semibold text-gray-800">Change password</p>
          <p className="text-xs text-gray-400 -mt-2">Leave blank to keep your current password.</p>
          
          <div>
            <label className="label">Current password</label>
            <input
              className="input"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="label">New password</label>
            <input
              className="input"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="••••••••"
            />
            {newPassword && (
              <div className="mt-2 space-y-1.5 p-3 bg-gray-50 rounded-xl border border-gray-100 transition-all duration-300">
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full ${newPasswordStrength.color} transition-all duration-300`} style={{ width: `${(newPasswordStrength.score / 5) * 100}%` }}></div>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-gray-600">Password Strength:</span>
                  <span className={newPasswordStrength.textColor}>{newPasswordStrength.strength}</span>
                </div>
                <ul className="text-[11px] grid grid-cols-2 gap-x-2 gap-y-1 text-gray-500 pt-1 border-t border-gray-200/50 mt-1">
                  <li className="flex items-center gap-1">
                    <span className={newPasswordStrength.reqs.length ? "text-green-600 font-bold" : "text-gray-300"}>
                      {newPasswordStrength.reqs.length ? "✓" : "○"}
                    </span>
                    <span className={newPasswordStrength.reqs.length ? "text-gray-700 font-medium" : ""}>Min 8 characters</span>
                  </li>
                  <li className="flex items-center gap-1">
                    <span className={newPasswordStrength.reqs.upper ? "text-green-600 font-bold" : "text-gray-300"}>
                      {newPasswordStrength.reqs.upper ? "✓" : "○"}
                    </span>
                    <span className={newPasswordStrength.reqs.upper ? "text-gray-700 font-medium" : ""}>Uppercase (A-Z)</span>
                  </li>
                  <li className="flex items-center gap-1">
                    <span className={newPasswordStrength.reqs.lower ? "text-green-600 font-bold" : "text-gray-300"}>
                      {newPasswordStrength.reqs.lower ? "✓" : "○"}
                    </span>
                    <span className={newPasswordStrength.reqs.lower ? "text-gray-700 font-medium" : ""}>Lowercase (a-z)</span>
                  </li>
                  <li className="flex items-center gap-1">
                    <span className={newPasswordStrength.reqs.number ? "text-green-600 font-bold" : "text-gray-300"}>
                      {newPasswordStrength.reqs.number ? "✓" : "○"}
                    </span>
                    <span className={newPasswordStrength.reqs.number ? "text-gray-700 font-medium" : ""}>Number (0-9)</span>
                  </li>
                  <li className="flex items-center gap-1 col-span-2">
                    <span className={newPasswordStrength.reqs.special ? "text-green-600 font-bold" : "text-gray-300"}>
                      {newPasswordStrength.reqs.special ? "✓" : "○"}
                    </span>
                    <span className={newPasswordStrength.reqs.special ? "text-gray-700 font-medium" : ""}>Special char (!@#$...)</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
          <div>
            <label className="label">Confirm new password</label>
            <input
              className="input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
