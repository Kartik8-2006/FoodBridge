import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../api.js';
import { useAuth } from '../../context/AuthContext.jsx';

export function useDashboardData() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const intervalRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!user?.role) return;
    try {
      setData(await api(`/dashboard/${user.role}`));
    } catch (err) {
      setError(err.message);
    }
  }, [user?.role]);

  useEffect(() => {
    if (!user?.role) return;
    // Initial load
    refresh();
    // Poll every 10 seconds so notifications and status changes appear automatically
    intervalRef.current = setInterval(refresh, 10000);
    return () => clearInterval(intervalRef.current);
  }, [user?.role]);

  return { data, error, refresh };
}
