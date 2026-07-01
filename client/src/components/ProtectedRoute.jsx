import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { dashboardPath } from '../utils.js';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <main className="section"><p>Loading your FoodBridge workspace...</p></main>;
  if (!user) return <Navigate to="/login" replace />;

  return children || <Navigate to={dashboardPath(user.role)} replace />;
}
