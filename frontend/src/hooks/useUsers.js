/**
 * useUsers — fetches the staff directory with optional search/filter params.
 */
import { useEffect, useState } from "react";
import { getUsers } from "../services/userService";

export function useUsers(params = {}) {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const key = JSON.stringify(params);

  useEffect(() => {
    setLoading(true);
    getUsers(params)
      .then(setUsers)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return { users, setUsers, loading, error };
}
