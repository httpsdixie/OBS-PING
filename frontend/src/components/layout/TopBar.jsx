/**
 * TopBar — mobile hamburger + notifications + Simple mode toggle.
 */
import { useState } from "react";
import { Bars3Icon, BellIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useNotifications } from "../../hooks/useNotifications";
import NotificationsDrawer from "../notifications/NotificationsDrawer";
import Modal from "../ui/Modal";
import TaskDetail from "../tasks/TaskDetail";
import Spinner from "../ui/Spinner";
import { getTask } from "../../services/taskService";

export default function TopBar({ onMenuClick }) {
  const { unreadCount } = useNotifications();
  const [showNotifs, setShowNotifs] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loadingTask, setLoadingTask]   = useState(false);
  const [taskUpdated, setTaskUpdated]   = useState(false);

  const handleTaskSelect = async (taskId) => {
    setLoadingTask(true);
    try {
      const taskData = await getTask(taskId);
      setSelectedTask(taskData);
    } catch (e) {
      toast.error("Failed to load task details.");
    } finally {
      setLoadingTask(false);
    }
  };

  const handleModalClose = () => {
    setSelectedTask(null);
    if (taskUpdated) {
      window.location.reload();
    }
  };

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

      {showNotifs && (
        <NotificationsDrawer
          onClose={() => setShowNotifs(false)}
          onTaskSelect={handleTaskSelect}
        />
      )}

      {loadingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center gap-3">
            <Spinner />
            <p className="text-sm text-gray-500 font-medium animate-pulse">Loading task details...</p>
          </div>
        </div>
      )}

      {selectedTask && (
        <Modal title={selectedTask.title} onClose={handleModalClose}>
          <TaskDetail
            task={selectedTask}
            onUpdated={(updated) => {
              setSelectedTask(updated);
              setTaskUpdated(true);
            }}
            onDeleted={() => {
              handleModalClose();
              window.location.reload();
            }}
            onClose={handleModalClose}
          />
        </Modal>
      )}
    </>
  );
}
