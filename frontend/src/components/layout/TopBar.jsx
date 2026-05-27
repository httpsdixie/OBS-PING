/**
 * TopBar — mobile hamburger + notifications + Simple mode toggle.
 */
import { useState } from "react";
import { Bars3Icon, BellIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { useNotifications } from "../../hooks/useNotifications";
import { useSimpleMode } from "../../context/SimpleModeContext";
import NotificationsDrawer from "../notifications/NotificationsDrawer";

export default function TopBar({ onMenuClick }) {
  const { unreadCount } = useNotifications();
  const { simpleMode, setSimpleMode, restartTour } = useSimpleMode();
  const [showNotifs, setShowNotifs] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-2">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 min-h-[44px] min-w-[44px]"
          aria-label="Open menu"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>

        <span className="md:hidden font-bold text-maroon-700 text-lg flex-1">OBS PING</span>

        <div className="hidden md:block flex-1" />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSimpleMode(!simpleMode)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium min-h-[44px] border transition-colors ${
              simpleMode
                ? "bg-maroon-50 border-maroon-300 text-maroon-800"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
            title={simpleMode ? "Simple mode on" : "Pro mode"}
          >
            <SparklesIcon className="w-5 h-5" />
            <span className="hidden sm:inline">{simpleMode ? "Simple" : "Pro"}</span>
          </button>
          <button
            type="button"
            onClick={restartTour}
            className="hidden lg:inline text-xs text-maroon-700 hover:underline px-2 min-h-[44px]"
          >
            Tour
          </button>
          <button
            onClick={() => setShowNotifs(true)}
            className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Notifications"
          >
            <BellIcon className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-maroon-700 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {showNotifs && <NotificationsDrawer onClose={() => setShowNotifs(false)} />}
    </>
  );
}
