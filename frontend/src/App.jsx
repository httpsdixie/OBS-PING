/**
 * App — root router. All routes defined here.
 */
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster, ToastBar, toast } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { SimpleModeProvider } from "./context/SimpleModeContext";

import AppLayout       from "./components/layout/AppLayout";
import ProtectedRoute  from "./components/layout/ProtectedRoute";

import LoginPage         from "./pages/LoginPage";
import DashboardPage     from "./pages/DashboardPage";
import TasksPage         from "./pages/TasksPage";
import MyTasksPage       from "./pages/MyTasksPage";
import DirectoryPage     from "./pages/DirectoryPage";
import AdminCenterPage   from "./pages/AdminCenterPage";
import MaintenancePage   from "./pages/MaintenancePage";

export default function App() {
  return (
    <AuthProvider>
      <SimpleModeProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 5000,
            style: {
              fontSize: "14px",
              borderRadius: "10px",
              padding: "12px 16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            },
            success: {
              iconTheme: { primary: "#7B1C1C", secondary: "#fff" },
              style: { background: "#fff", color: "#1a1a1a", borderLeft: "4px solid #7B1C1C" },
            },
            error: {
              iconTheme: { primary: "#dc2626", secondary: "#fff" },
              style: { background: "#fff", color: "#1a1a1a", borderLeft: "4px solid #dc2626" },
            },
          }}
        >
          {(t) => (
            <ToastBar toast={t}>
              {({ icon, message }) => (
                <>
                  {icon}
                  {message}
                  {t.type !== "loading" && (
                    <button
                      onClick={() => toast.dismiss(t.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: "2px",
                        marginLeft: "8px",
                        fontSize: "14px",
                        lineHeight: "1",
                        color: "#94a3b8",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "color 0.2s, transform 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#7b1c1c";
                        e.currentTarget.style.transform = "scale(1.2)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#94a3b8";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      ✕
                    </button>
                  )}
                </>
              )}
            </ToastBar>
          )}
        </Toaster>
        <Routes>
           {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Protected shell */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute roles={["super_admin", "admin", "consultant"]} permission="view_all_tasks">
                  <TasksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-tasks"
              element={
                <ProtectedRoute roles={["staff"]}>
                  <MyTasksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/directory"
              element={
                <ProtectedRoute roles={["super_admin", "admin", "consultant"]} permission="view_directory">
                  <DirectoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={["super_admin"]}>
                  <AdminCenterPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      </SimpleModeProvider>
    </AuthProvider>
  );
}
