/**
 * NotificationsDrawer — slide-in panel triggered from the TopBar bell icon.
 */
import { format } from "date-fns";
import { BellIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import Drawer from "../ui/Drawer";
import Spinner from "../ui/Spinner";
import { useNotifications } from "../../hooks/useNotifications";

const TYPE_LABELS = {
  automated_weekend: "Weekend Reminder",
  deadline_reminder: "Deadline Alert",
  manual_poke:       "Poke from Admin",
  task_assigned:     "Task Assigned",
  status_update:     "Status Update",
};

const TYPE_STYLES = {
  automated_weekend: "bg-yellow-50 border-yellow-200",
  deadline_reminder: "bg-red-50 border-red-200",
  manual_poke:       "bg-orange-50 border-orange-200",
  task_assigned:     "bg-blue-50 border-blue-200",
  status_update:     "bg-purple-50 border-purple-200",
};

export default function NotificationsDrawer({ onClose }) {
  const { notifications, loading, handleMarkRead, handleMarkAllRead } = useNotifications();
  const unread = notifications.filter((n) => !n.is_read).length;

  const onMarkRead = async (id) => {
    await handleMarkRead(id);
    toast.success("Marked as read.");
  };

  const onMarkAllRead = async () => {
    await handleMarkAllRead();
    toast.success("All notifications marked as read.");
  };

  return (
    <Drawer title="Notifications" onClose={onClose}>
      {/* Mark all read */}
      {unread > 0 && (
        <div className="flex justify-end mb-3">
          <button className="text-xs text-maroon-700 hover:underline" onClick={onMarkAllRead}>
            Mark all as read
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BellIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-lg border p-3 ${TYPE_STYLES[n.type] ?? "bg-white border-gray-100"} ${
                !n.is_read ? "ring-1 ring-maroon-300" : "opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                    {TYPE_LABELS[n.type] ?? n.type}
                  </p>
                  <p className="text-sm text-gray-800">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {format(new Date(n.sent_at), "MMM d · h:mm a")}
                  </p>
                </div>
                {!n.is_read && (
                  <button
                    onClick={() => onMarkRead(n.id)}
                    className="text-xs text-maroon-700 hover:underline flex-shrink-0 min-h-[44px] flex items-center"
                  >
                    ✓
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}
