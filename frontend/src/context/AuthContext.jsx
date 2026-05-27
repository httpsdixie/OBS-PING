/**
 * AuthContext — provides current user, role helpers, and permission checks app-wide.
 */
import { createContext, useContext, useEffect, useState } from "react";
import { getMe } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }
    getMe()
      .then(setUser)
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  const isSuperAdmin = user?.role === "super_admin";
  const isAdmin      = user?.role === "admin" || isSuperAdmin;
  const isConsultant = user?.role === "consultant";
  const isStaff      = user?.role === "staff";

  // Check a module permission — only super_admin gets everything by default
  const hasPermission = (perm) => {
    if (isSuperAdmin) return true;
    return user?.permissions?.includes(perm) ?? false;
  };

  const canWrite       = hasPermission("create_tasks");
  const canPoke        = hasPermission("poke");
  const canViewAll     = hasPermission("view_all_tasks");
  const canViewDir     = hasPermission("view_directory");
  const canViewAudit   = hasPermission("view_audit");

  return (
    <AuthContext.Provider value={{
      user, setUser, loading,
      isSuperAdmin, isAdmin, isConsultant, isStaff,
      hasPermission, canWrite, canPoke, canViewAll, canViewDir, canViewAudit,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
