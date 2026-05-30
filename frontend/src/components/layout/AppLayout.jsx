/**
 * AppLayout — shell with responsive sidebar + top bar.
 * Sidebar collapses to a drawer on mobile.
 */
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import UnreadNotificationsToast from "../notifications/UnreadNotificationsToast";
import WelcomeTour from "../onboarding/WelcomeTour";
import AuditModal from "../audit/AuditModal";
import PermissionsModal from "../permissions/PermissionsModal";
import AccountModal from "../account/AccountModal";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAudit, setShowAudit]               = useState(false);
  const [showPermissions, setShowPermissions]   = useState(false);
  const [showAccount, setShowAccount]           = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <WelcomeTour />
      <UnreadNotificationsToast />
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar
          onOpenAudit={() => setShowAudit(true)}
          onOpenPermissions={() => setShowPermissions(true)}
          onOpenAccount={() => setShowAccount(true)}
        />
      </div>

      {/* Mobile drawer overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-50">
            <Sidebar
              onClose={() => setSidebarOpen(false)}
              onOpenAudit={() => setShowAudit(true)}
              onOpenPermissions={() => setShowPermissions(true)}
              onOpenAccount={() => setShowAccount(true)}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {showAudit       && <AuditModal onClose={() => setShowAudit(false)} />}
      {showPermissions && <PermissionsModal onClose={() => setShowPermissions(false)} />}
      {showAccount     && <AccountModal onClose={() => setShowAccount(false)} />}
    </div>
  );
}
