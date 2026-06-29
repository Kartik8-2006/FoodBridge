import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { useAuth } from '../../context/AuthContext.jsx';

export function useDashboardData() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  async function refresh() {
    try {
      setData(await api(`/dashboard/${user.role}`));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (user?.role) refresh();
  }, [user?.role]);

  return { data, error, refresh };
}
