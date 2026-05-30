/**
 * ProtectedRoute — redirects unauthenticated users to /login.
 * Optionally restricts to specific roles (e.g. super_admin only).
 */
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Spinner from "../ui/Spinner";

export default function ProtectedRoute({ children, roles, permission }) {
  const { user, loading, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-10 h-10" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (permission && hasPermission(permission)) {
    return children;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
