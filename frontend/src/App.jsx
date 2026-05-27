/**
 * App — root router. All routes defined here.
 */
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
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

export default function App() {
  return (
    <AuthProvider>
      <SimpleModeProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
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
        />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
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
                <ProtectedRoute roles={["super_admin", "admin", "consultant"]}>
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
                <ProtectedRoute roles={["super_admin", "admin", "consultant"]}>
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
