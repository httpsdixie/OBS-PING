/**
 * useTasks — fetches and caches the task list with optional filters.
 */
import { useEffect, useState } from "react";
import { getTasks } from "../services/taskService";

export function useTasks(filters = {}) {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const key = JSON.stringify(filters);

  useEffect(() => {
    setLoading(true);
    getTasks(filters)
      .then(setTasks)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return { tasks, setTasks, loading, error };
}
