import { BarChart3, Bell, ClipboardList, HeartHandshake, Home, LayoutDashboard, LogOut, MapPin, PackageCheck, RefreshCcw, Settings, ShieldCheck, Soup, Star, Truck, UserRoundCog, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { formatDate, titleCase } from '../../utils.js';

export function DashboardShell({ eyebrow, title, children, actions }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const menuByRole = {
    donor: [
      {
        section: 'Overview',
        items: [
          [LayoutDashboard, 'Dashboard', '#dashboard-home'],
          [Bell, 'Notifications', '#notifications'],
          [UserRoundCog, 'Profile', '#profile']
        ]
      },
      {
        section: 'Donation Flow',
        items: [
          [PackageCheck, 'Donate Food', '#donate-food'],
          [ClipboardList, 'My Active Donations', '#active-donations'],
          [ClipboardList, 'Donation History', '#donation-history'],
          [MapPin, 'Track Donations', '#track-donations'],
          [Settings, 'Settings', '#settings']
        ]
      }
    ],
    ngo: [
      {
        section: 'Overview',
        items: [
          [LayoutDashboard, 'Dashboard', '#ngo-home'],
          [Bell, 'Notifications', '#notifications'],
          [UserRoundCog, 'Profile', '#profile']
        ]
      },
      {
        section: 'Operations',
        items: [
          [PackageCheck, 'Available Donations', '#available-donations'],
          [Truck, 'Claimed Donations', '#claimed-donations'],
          [ClipboardList, 'Food Requests', '#food-requests'],
          [UsersRound, 'Beneficiaries', '#beneficiaries'],
          [Truck, 'Volunteers', '#volunteers']
        ]
      },
      {
        section: 'Insights',
        items: [
          [BarChart3, 'Reports', '#reports']
        ]
      }
    ],
    volunteer: [
      {
        section: 'Overview',
        items: [
          [LayoutDashboard, 'Dashboard', '#volunteer-home'],
          [MapPin, 'Available Pickups', '#available-pickups'],
          [Truck, 'Assigned Deliveries', '#assigned-deliveries']
        ]
      },
      {
        section: 'Route Work',
        items: [
          [MapPin, 'Navigation', '#navigation'],
          [PackageCheck, 'Delivery History', '#delivery-history'],
          [BarChart3, 'Performance', '#performance']
        ]
      },
      {
        section: 'Support',
        items: [
          [Bell, 'Notifications', '#notifications'],
          [UserRoundCog, 'Profile', '#profile']
        ]
      }
    ],
    recipient: [
      {
        section: 'Overview',
        items: [
          [LayoutDashboard, 'Dashboard'],
          [ClipboardList, 'Request Food'],
          [MapPin, 'Nearby Support'],
          [Bell, 'Notifications'],
          [UserRoundCog, 'Profile']
        ]
      }
    ],
    admin: [
      {
        section: 'Overview',
        items: [
          [LayoutDashboard, 'Dashboard', '#admin-home'],
          [Bell, 'Notifications', '#notifications'],
          [Settings, 'Settings', '#settings']
        ]
      },
      {
        section: 'People',
        items: [
          [UsersRound, 'Users', '#users'],
          [PackageCheck, 'Donors', '#donors'],
          [HeartHandshake, 'NGOs', '#ngos'],
          [Truck, 'Volunteers', '#volunteers']
        ]
      },
      {
        section: 'Operations',
        items: [
          [ClipboardList, 'Donations', '#donations'],
          [Soup, 'Food Requests', '#food-requests'],
          [BarChart3, 'Reports', '#reports'],
          [BarChart3, 'Analytics', '#analytics'],
          [ShieldCheck, 'Verification', '#verification']
        ]
      }
    ]
  };

  const navItems = menuByRole[user?.role] || menuByRole.donor;

  return (
    <div className="app-dashboard">
      <aside className="dashboard-sidebar">
        <Link className="dashboard-brand" to="/">
          <span>FB</span>
          <div><strong>FoodBridge</strong><small>{t("Management Platform") || "Management Platform"}</small></div>
        </Link>
        <div className="dashboard-user">
          <div className="avatar">{user?.name?.charAt(0) || 'U'}</div>
          <div><strong>{user?.name}</strong><small>{t(titleCase(user?.role || ''))}</small></div>
        </div>
        <nav>
          {navItems.map((group) => (
            <div className="dashboard-nav-group" key={group.section || 'group'}>
              {group.section && <span className="dashboard-nav-section">{t(group.section)}</span>}
              {group.items.map(([Icon, label, href = '#'], index) => (
                <a className={index === 0 && group.section === 'Overview' ? 'active' : ''} href={href} key={label}>
                  <Icon size={19} /> {t(label)}
                </a>
              ))}
            </div>
          ))}
        </nav>
        <button className="dashboard-logout" onClick={logout}><LogOut size={18} /> {t("Logout")}</button>
      </aside>

      <section className="dashboard-workspace">
        <header className="dashboard-topbar">
          <div>
            <p className="dashboard-kicker">{t(eyebrow)}</p>
            <h1>{t(title)}</h1>
          </div>
          <div className="dashboard-top-actions">
            <span className="live-chip"><span /> {t("Live Update")}</span>
            <button aria-label="Refresh dashboard"><RefreshCcw size={18} /></button>
            <button aria-label="Notifications"><Bell size={18} /></button>
            <Link className="dashboard-home" to="/"><Home size={18} /> {t("Public Site")}</Link>
            {actions}
          </div>
        </header>
        <main className="dashboard-content">{children}</main>
      </section>
    </div>
  );
}

export function StatGrid({ stats = {} }) {
  const { t } = useLanguage();
  const entries = Object.entries(stats);
  return (
    <section className="dashboard-stat-grid">
      {entries.map(([key, value], index) => (
        <article className={index === 0 ? 'dashboard-stat-card primary' : 'dashboard-stat-card'} key={key}>
          <span>{t(titleCase(key))}</span>
          <strong>{value}</strong>
          <small>{index === 0 ? t('Primary operating metric') : t('Updated from live platform data')}</small>
        </article>
      ))}
    </section>
  );
}

export function DonationTable({ donations = [], onAccept, onDeliver }) {
  const { t } = useLanguage();
  return (
    <div className="dashboard-table-wrap">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>{t("Food Name")}</th>
            <th>{t("Estimated Meals")}</th>
            <th>{t("City")}</th>
            <th>{t("Status")}</th>
            <th>{t("Expiry / Safe Before")}</th>
            <th>{t("Action")}</th>
          </tr>
        </thead>
        <tbody>
          {donations.map((donation) => (
            <tr key={donation._id}>
              <td>{donation.title}</td>
              <td>{donation.estimatedMeals}</td>
              <td>{donation.city}</td>
              <td><span className="status">{t(titleCase(donation.status))}</span></td>
              <td>{formatDate(donation.safeBefore)}</td>
              <td>
                {onAccept && donation.status === 'posted' && <button onClick={() => onAccept(donation._id)}>{t("Accept")}</button>}
                {onDeliver && donation.status !== 'delivered' && donation.status !== 'posted' && <button onClick={() => onDeliver(donation._id)}>{t("Mark Delivered") || t("Delivered")}</button>}
              </td>
            </tr>
          ))}
          {!donations.length && <tr><td colSpan="6">{t("No records yet.") || "No records yet."}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export function NotificationList({ items = [] }) {
  const { t } = useLanguage();
  return (
    <section className="dashboard-panel">
      <h2>{t("Notifications")}</h2>
      {items.map((item) => (
        <article className="notification" key={item._id}>
          <strong>{item.title}</strong>
          <p>{item.message}</p>
        </article>
      ))}
      {!items.length && <p>{t("No notifications yet.")}</p>}
    </section>
  );
}

export function DashboardMapPanel() {
  const { t } = useLanguage();
  return (
    <section className="dashboard-panel map-panel">
      <div>
        <h2>{t("Distribution Network")}</h2>
        <p>{t("Live view of donation points, pickup routes, and community delivery coverage.")}</p>
      </div>
      <div className="map-visual">
        <span className="pin warehouse">{t("Warehouse Hub") || "Warehouse Hub"}</span>
        <span className="pin donor">{t("Donor") || "Donor"}</span>
        <span className="pin ngo">{t("NGO Center") || "NGO Center"}</span>
      </div>
    </section>
  );
}

export function QuickActions({ children }) {
  return <section className="quick-actions">{children}</section>;
}
