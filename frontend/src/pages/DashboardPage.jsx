/**
 * DashboardPage — role-aware summary view (Google Classroom-style stream).
 * Shows task stats, calendar, and recent tasks.
 */
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSimpleMode } from "../context/SimpleModeContext";
import { taskStatusLabel } from "../constants/labels";
import { useTasks } from "../hooks/useTasks";
import StatusBadge from "../components/ui/StatusBadge";
import CalendarView from "../components/tasks/CalendarView";
import Modal from "../components/ui/Modal";
import TaskDetail from "../components/tasks/TaskDetail";
import ActionQueueModal from "../components/dashboard/ActionQueueModal";
import Spinner from "../components/ui/Spinner";
import { useState } from "react";
import { format } from "date-fns";

const STAT_STATUSES = ["assigned", "acknowledged", "submitted", "checked", "needs_revision", "published"];

export default function DashboardPage() {
  const { user, isStaff } = useAuth();
  const { simpleMode } = useSimpleMode();
  const { tasks, setTasks, loading }   = useTasks();
  const [selected, setSelected]        = useState(null);
  const [showQueue, setShowQueue]       = useState(false);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  const counts = STAT_STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s).length;
    return acc;
  }, {});

  const recent = [...tasks]
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 5);

  const handleUpdated = (updated) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelected(updated);
  };

  const handleDeleted = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSelected(null);
  };

  // Stages needing current user's action
  const actionNeeded = tasks.reduce((acc, task) => {
    const stages = task.stages ?? [];
    stages.forEach((s) => {
      const role = user?.role;
      const needsMe =
        // Staff: their stage is assigned/acknowledged/needs_revision
        (role === "staff" && s.assignee_id === user?.id &&
          ["assigned", "acknowledged", "needs_revision"].includes(s.status)) ||
        // Admin: any stage is submitted
        (role === "admin" && s.status === "submitted") ||
        // EIC: any stage is checked
        (role === "super_admin" && s.status === "checked");
      if (needsMe) acc++;
    });
    return acc;
  }, 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Welcome */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-gray-500 capitalize mt-0.5">
            {user?.role?.replace("_", " ")} {user?.position ? `· ${user.position}` : ""}
          </p>
        </div>

        {/* Action needed badge */}
        {actionNeeded > 0 && (
          <button
            onClick={() => setShowQueue(true)}
            className={`flex-shrink-0 flex flex-col items-center justify-center bg-maroon-700 text-white rounded-xl hover:bg-maroon-800 transition-colors text-center shadow-lg ${
              simpleMode ? "px-5 py-4 min-w-[120px]" : "px-4 py-3 min-w-[80px]"
            }`}
          >
            <span className={`font-bold leading-none ${simpleMode ? "text-3xl" : "text-2xl"}`}>
              {actionNeeded}
            </span>
            <span className={`mt-1 opacity-95 font-medium ${simpleMode ? "text-sm" : "text-xs"}`}>
              {simpleMode
                ? (user?.role === "super_admin" ? "Tap to approve" :
                   user?.role === "admin" ? "Tap to review" : "Needs you!")
                : (user?.role === "super_admin" ? "To Approve" :
                   user?.role === "admin" ? "To Review" : "Pending")}
            </span>
          </button>
        )}
      </div>

      {/* Stat cards */}
      {!isStaff && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { key: "assigned",       color: "bg-blue-50 text-blue-700" },
            { key: "acknowledged",   color: "bg-blue-50 text-blue-800" },
            { key: "submitted",      color: "bg-yellow-50 text-yellow-800" },
            { key: "checked",        color: "bg-purple-50 text-purple-800" },
            { key: "needs_revision", color: "bg-red-50 text-red-700" },
            { key: "published",      color: "bg-green-50 text-green-700" },
          ].map(({ key, color }) => (
            <div key={key} className={`card ${color}`}>
              <p className="text-2xl font-bold">{counts[key]}</p>
              <p className="text-xs font-medium mt-0.5">{taskStatusLabel(key, simpleMode)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Calendar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Calendar</h2>
          <Link to={isStaff ? "/my-tasks" : "/tasks"} className="text-sm text-maroon-700 hover:underline">
            {isStaff ? "View My Tasks →" : "Open Master List →"}
          </Link>
        </div>
        <CalendarView tasks={tasks} onTaskClick={setSelected} />
      </div>

      {/* Recent tasks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Recent Tasks</h2>
          <Link to={isStaff ? "/my-tasks" : "/tasks"} className="text-sm text-maroon-700 hover:underline">View all →</Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            {simpleMode ? "You're all caught up! 🎉" : "No tasks yet."}
          </p>
        ) : (
          <div className="space-y-2">
            {recent.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className="card w-full text-left flex items-center justify-between gap-3 hover:shadow-md transition-shadow"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{t.title}</p>
                  <p className="text-xs text-gray-400">
                    Due {format(new Date(t.deadline), "MMM d")}
                    {t.assignee ? ` · ${t.assignee.name}` : ""}
                  </p>
                </div>
                <StatusBadge status={t.status} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Task detail modal */}
      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)}>
          <TaskDetail
            task={selected}
            onUpdated={handleUpdated}
            onDeleted={handleDeleted}
            onClose={() => setSelected(null)}
          />
        </Modal>
      )}

      {/* Action queue modal */}
      {showQueue && (
        <ActionQueueModal
          tasks={tasks}
          onTaskUpdated={(updated) => {
            setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
          }}
          onClose={() => setShowQueue(false)}
        />
      )}
    </div>
  );
}
