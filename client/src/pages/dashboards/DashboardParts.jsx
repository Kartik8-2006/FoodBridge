import { BarChart3, Bell, ClipboardList, HeartHandshake, Home, LayoutDashboard, LogOut, MapPin, PackageCheck, RefreshCcw, Settings, ShieldCheck, Soup, Star, Truck, UserRoundCog, UsersRound } from 'lucide-react';
import { Children, cloneElement, isValidElement, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { formatDate, titleCase } from '../../utils.js';

export function DashboardShell({ eyebrow, title, children, actions }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
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
      [LayoutDashboard, 'Dashboard', '#admin-home'],
      [UsersRound, 'Users', '#users'],
      [PackageCheck, 'Donors', '#donors'],
      [HeartHandshake, 'NGOs', '#ngos'],
      [Truck, 'Volunteers', '#volunteers'],
      [ClipboardList, 'Donations', '#donations'],
      [Soup, 'Food Requests', '#food-requests'],
      [BarChart3, 'Reports', '#reports'],
      [BarChart3, 'Analytics', '#analytics'],
      [ShieldCheck, 'Verification', '#verification'],
      [Bell, 'Notifications', '#notifications'],
      [Settings, 'Settings', '#settings']
    ]
  };
  
  const navItems = menuByRole[user?.role] || menuByRole.donor;
  const defaultHref = navItems[0]?.[2] || '#dashboard-home';
  const [activeHref, setActiveHref] = useState(location.hash || defaultHref);
  const activeTarget = activeHref.replace('#', '');
  const visibleChildren = useMemo(() => filterDashboardChildren(children, activeTarget), [children, activeTarget]);

  async function loadNotifications() {
    try {
      const data = await api('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  }

  async function openNotification(notification) {
    try {
      await api(`/notifications/${notification._id}/read`, { method: 'PATCH' });
    } catch {
      // Continue with navigation even if read status update fails.
    }
    setNotificationOpen(false);
    await loadNotifications();
    const link = notification.link || `/dashboard/${user.role}`;
    const hash = link.includes('#') ? `#${link.split('#')[1]}` : defaultHref;
    setActiveHref(hash);
    navigate(link);
  }

  useEffect(() => {
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 15000);
    return () => window.clearInterval(timer);
  }, [user?.id]);

  useEffect(() => {
    setActiveHref(location.hash || defaultHref);
  }, [location.hash, defaultHref]);

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
          {navItems.map(([Icon, label, href = '#']) => (
            <a
              className={activeHref === href ? 'active' : ''}
              href={href}
              key={label}
              onClick={(event) => {
                event.preventDefault();
                setActiveHref(href);
                window.history.replaceState(null, '', `${location.pathname}${href}`);
              }}
            >
              <Icon size={19} /> {t(label)}
            </a>
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
            <div className="dashboard-notification-menu">
              <button className="dashboard-bell" type="button" aria-label="Notifications" onClick={() => setNotificationOpen((value) => !value)}>
                <Bell size={18} />
                {unreadCount > 0 && <span>{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>
              {notificationOpen && (
                <div className="dashboard-notification-popover">
                  <div className="notification-popover-head">
                    <strong>{t("Notifications")}</strong>
                    {unreadCount > 0 && <small>{unreadCount} {t("new")}</small>}
                  </div>
                  <div className="site-notification-list">
                    {notifications.map((notification) => (
                      <button
                        className={notification.readAt ? 'site-notification-item' : 'site-notification-item unread'}
                        key={notification._id}
                        type="button"
                        onClick={() => openNotification(notification)}
                      >
                        <strong>{notification.title}</strong>
                        <span>{notification.message}</span>
                        {notification.distanceLabel && <em>{notification.distanceLabel} {t("from donor")}</em>}
                      </button>
                    ))}
                    {!notifications.length && <p className="empty-state">{t("No notifications yet.")}</p>}
                  </div>
                </div>
              )}
            </div>
            <Link className="dashboard-home" to="/"><Home size={18} /> {t("Public Site")}</Link>
            {actions}
          </div>
        </header>
        <main className="dashboard-content">{visibleChildren}</main>
      </section>
    </div>
  );
}

function elementMatchesTarget(element, targetId) {
  if (!isValidElement(element)) return false;
  return element.props?.id === targetId || element.props?.['data-dashboard-section'] === targetId;
}

function pruneToTarget(node, targetId) {
  if (!isValidElement(node)) return null;
  if (elementMatchesTarget(node, targetId)) return node;

  const children = Children.toArray(node.props?.children);
  const prunedChildren = children.map((child) => pruneToTarget(child, targetId)).filter(Boolean);

  if (!prunedChildren.length) return null;
  const filteredClass = prunedChildren.length === 1 ? 'dashboard-filtered-group dashboard-filtered-single' : 'dashboard-filtered-group';
  return cloneElement(node, { className: `${node.props.className || ''} ${filteredClass}`.trim() }, prunedChildren);
}

function filterDashboardChildren(children, targetId) {
  const childArray = Children.toArray(children);
  const homeTargets = ['dashboard-home', 'ngo-home', 'volunteer-home', 'admin-home'];

  if (homeTargets.includes(targetId)) {
    return childArray.slice(0, 2);
  }

  const filtered = childArray.map((child) => pruneToTarget(child, targetId)).filter(Boolean);
  return filtered.length ? filtered : childArray.slice(0, 2);
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
  const navigate = useNavigate();

  async function openNotification(item) {
    try {
      await api(`/notifications/${item._id}/read`, { method: 'PATCH' });
    } catch {
      // Keep the notification card useful even if the server update fails.
    }
    navigate(item.link || '#notifications');
  }

  return (
    <section className="dashboard-panel" id="notifications">
      <h2>{t("Notifications")}</h2>
      {items.map((item) => (
        <button className={item.readAt ? 'notification dashboard-notification-card' : 'notification dashboard-notification-card unread'} type="button" key={item._id} onClick={() => openNotification(item)}>
          <strong>{item.title}</strong>
          <p>{item.message}</p>
          {item.distanceLabel && <small>{item.distanceLabel} {t("from donor")}</small>}
        </button>
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
