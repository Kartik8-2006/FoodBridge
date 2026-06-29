import { BarChart3, Bell, ClipboardList, HeartHandshake, Home, LayoutDashboard, LogOut, MapPin, PackageCheck, RefreshCcw, Settings, Star, Truck, UserRoundCog, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatDate, titleCase } from '../../utils.js';

export function DashboardShell({ eyebrow, title, children, actions }) {
  const { user, logout } = useAuth();
  const menuByRole = {
    donor: [
      [LayoutDashboard, 'Dashboard', '#dashboard-home'],
      [PackageCheck, 'Donate Food', '#donate-food'],
      [ClipboardList, 'My Active Donations', '#active-donations'],
      [ClipboardList, 'Donation History', '#donation-history'],
      [MapPin, 'Track Donations', '#track-donations'],
      [Bell, 'Notifications', '#notifications'],
      [UserRoundCog, 'Profile', '#profile'],
      [Settings, 'Settings', '#settings']
    ],
    ngo: [
      [LayoutDashboard, 'Dashboard', '#ngo-home'],
      [PackageCheck, 'Available Donations', '#available-donations'],
      [Truck, 'Claimed Donations', '#claimed-donations'],
      [ClipboardList, 'Food Requests', '#food-requests'],
      [UsersRound, 'Beneficiaries', '#beneficiaries'],
      [Truck, 'Volunteers', '#volunteers'],
      [BarChart3, 'Reports', '#reports'],
      [Bell, 'Notifications', '#notifications'],
      [UserRoundCog, 'Profile', '#profile']
    ],
    volunteer: [
      [LayoutDashboard, 'Dashboard', '#volunteer-home'],
      [MapPin, 'Available Pickups', '#available-pickups'],
      [Truck, 'Assigned Deliveries', '#assigned-deliveries'],
      [PackageCheck, 'Delivery History', '#delivery-history'],
      [MapPin, 'Navigation', '#navigation'],
      [Bell, 'Notifications', '#notifications'],
      [UserRoundCog, 'Profile', '#profile']
    ],
    recipient: [
      [LayoutDashboard, 'Dashboard'],
      [ClipboardList, 'Request Food'],
      [MapPin, 'Nearby Support'],
      [Bell, 'Notifications'],
      [UserRoundCog, 'Profile']
    ],
    admin: [
      [LayoutDashboard, 'Dashboard'],
      [UsersRound, 'Users'],
      [PackageCheck, 'Donors'],
      [HeartHandshake, 'NGOs'],
      [Truck, 'Volunteers'],
      [ClipboardList, 'Donations'],
      [BarChart3, 'Reports'],
      [Settings, 'Settings']
    ]
  };
  const navItems = menuByRole[user?.role] || menuByRole.donor;

  return (
    <div className="app-dashboard">
      <aside className="dashboard-sidebar">
        <Link className="dashboard-brand" to="/">
          <span>FB</span>
          <div><strong>FoodBridge</strong><small>Management Platform</small></div>
        </Link>
        <div className="dashboard-user">
          <div className="avatar">{user?.name?.charAt(0) || 'U'}</div>
          <div><strong>{user?.name}</strong><small>{titleCase(user?.role || '')}</small></div>
        </div>
        <nav>
          {navItems.map(([Icon, label, href = '#'], index) => (
            <a className={index === 0 ? 'active' : ''} href={href} key={label}>
              <Icon size={19} /> {label}
            </a>
          ))}
        </nav>
        <button className="dashboard-logout" onClick={logout}><LogOut size={18} /> Logout</button>
      </aside>

      <section className="dashboard-workspace">
        <header className="dashboard-topbar">
          <div>
            <p className="dashboard-kicker">{eyebrow}</p>
            <h1>{title}</h1>
          </div>
          <div className="dashboard-top-actions">
            <span className="live-chip"><span /> Live Update</span>
            <button aria-label="Refresh dashboard"><RefreshCcw size={18} /></button>
            <button aria-label="Notifications"><Bell size={18} /></button>
            <Link className="dashboard-home" to="/"><Home size={18} /> Public Site</Link>
            {actions}
          </div>
        </header>
        <main className="dashboard-content">{children}</main>
      </section>
    </div>
  );
}

export function StatGrid({ stats = {} }) {
  const entries = Object.entries(stats);
  return (
    <section className="dashboard-stat-grid">
      {entries.map(([key, value], index) => (
        <article className={index === 0 ? 'dashboard-stat-card primary' : 'dashboard-stat-card'} key={key}>
          <span>{titleCase(key)}</span>
          <strong>{value}</strong>
          <small>{index === 0 ? 'Primary operating metric' : 'Updated from live platform data'}</small>
        </article>
      ))}
    </section>
  );
}

export function DonationTable({ donations = [], onAccept, onDeliver }) {
  return (
    <div className="dashboard-table-wrap">
      <table className="dashboard-table">
        <thead><tr><th>Food</th><th>Meals</th><th>City</th><th>Status</th><th>Safe Before</th><th>Action</th></tr></thead>
        <tbody>
          {donations.map((donation) => (
            <tr key={donation._id}>
              <td>{donation.title}</td>
              <td>{donation.estimatedMeals}</td>
              <td>{donation.city}</td>
              <td><span className="status">{titleCase(donation.status)}</span></td>
              <td>{formatDate(donation.safeBefore)}</td>
              <td>
                {onAccept && donation.status === 'posted' && <button onClick={() => onAccept(donation._id)}>Accept</button>}
                {onDeliver && donation.status !== 'delivered' && donation.status !== 'posted' && <button onClick={() => onDeliver(donation._id)}>Delivered</button>}
              </td>
            </tr>
          ))}
          {!donations.length && <tr><td colSpan="6">No records yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export function NotificationList({ items = [] }) {
  return (
    <section className="dashboard-panel">
      <h2>Notifications</h2>
      {items.map((item) => (
        <article className="notification" key={item._id}>
          <strong>{item.title}</strong>
          <p>{item.message}</p>
        </article>
      ))}
      {!items.length && <p>No notifications yet.</p>}
    </section>
  );
}

export function DashboardMapPanel() {
  return (
    <section className="dashboard-panel map-panel">
      <div>
        <h2>Distribution Network</h2>
        <p>Live view of donation points, pickup routes, and community delivery coverage.</p>
      </div>
      <div className="map-visual">
        <span className="pin warehouse">Warehouse Hub</span>
        <span className="pin donor">Donation Point</span>
        <span className="pin ngo">NGO Center</span>
      </div>
    </section>
  );
}

export function QuickActions({ children }) {
  return <section className="quick-actions">{children}</section>;
}
