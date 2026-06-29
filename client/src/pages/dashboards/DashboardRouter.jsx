import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import DonorDashboard from './DonorDashboard.jsx';
import NgoDashboard from './NgoDashboard.jsx';
import RecipientDashboard from './RecipientDashboard.jsx';
import VolunteerDashboard from './VolunteerDashboard.jsx';

const dashboards = {
  donor: DonorDashboard,
  ngo: NgoDashboard,
  volunteer: VolunteerDashboard,
  recipient: RecipientDashboard,
  admin: AdminDashboard
};

export default function DashboardRouter() {
  const { role } = useParams();
  const { user } = useAuth();

  if (role !== user.role) {
    return (
      <main className="access-denied">
        <section>
          <strong>403</strong>
          <h1>Access denied</h1>
          <p>Your account role is <b>{user.role}</b>, so you cannot open the <b>{role}</b> dashboard.</p>
          <Link to={`/dashboard/${user.role}`}>Go to my dashboard</Link>
        </section>
      </main>
    );
  }

  const Dashboard = dashboards[user.role] || DonorDashboard;
  return <Dashboard />;
}
