/**
 * useNotifications — fetches notifications and exposes mark-read helpers.
 */
import { useEffect, useState } from "react";
import { getNotifications, markRead, markAllRead } from "../services/notificationService";

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);

  const fetch = () => {
    setLoading(true);
    getNotifications()
      .then(setNotifications)
      .finally(() => setLoading(false));
  };

  useEffect(fetch, []);

  const handleMarkRead = async (id) => {
    await markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return { notifications, loading, unreadCount, handleMarkRead, handleMarkAllRead, refetch: fetch };
}
