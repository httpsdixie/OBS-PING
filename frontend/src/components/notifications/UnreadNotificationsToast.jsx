/**
 * Shows a one-time toast when the user has unread notifications.
 */
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useNotifications } from "../../hooks/useNotifications";

export default function UnreadNotificationsToast() {
  const { unreadCount, loading } = useNotifications();
  const shown = useRef(false);

  useEffect(() => {
    if (loading || shown.current || unreadCount === 0) return;
    shown.current = true;
    toast(
      `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""} — tap the bell to view`,
      { icon: "🔔", duration: 5000 },
    );
  }, [loading, unreadCount]);

  return null;
}
