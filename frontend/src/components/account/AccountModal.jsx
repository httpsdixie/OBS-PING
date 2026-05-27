/**
 * AccountModal — members edit name, email, and password.
 */
import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import { useAuth } from "../../context/AuthContext";
import { updateMe, changePassword } from "../../services/userService";

export default function AccountModal({ onClose }) {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const wantsPasswordChange =
    currentPassword || newPassword || confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedName) {
      toast.error("Name cannot be empty.");
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
      if (newPassword.length < 8) {
        toast.error("New password must be at least 8 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("New passwords do not match.");
        return;
      }
    }

    setBusy(true);
    try {
      const updated = await updateMe({ name: trimmedName, email: trimmedEmail });
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
        <div>
          <label className="label">Full Name</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="border-t border-gray-200 pt-4 space-y-3">
          <p className="text-sm font-medium text-gray-800">Change password</p>
          <p className="text-xs text-gray-400 -mt-2">Leave blank to keep your current password.</p>
          <div>
            <label className="label">Current password</label>
            <input
              className="input"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
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
              minLength={8}
            />
          </div>
          <div>
            <label className="label">Confirm new password</label>
            <input
              className="input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
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
