import { BarChart3, Bell, CircleHelp, ClipboardList, Grid2X2, Heart, HeartHandshake, HelpCircle, LayoutDashboard, LogOut, MapPin, Package, PackageCheck, Plus, Search, Settings, ShieldCheck, Soup, Star, Truck, UserRoundCog, UsersRound } from 'lucide-react';
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
      [Grid2X2, 'Dashboard', '#dashboard-home'],
      [Heart, 'Donate Food', '#donate-food'],
      [Package, 'My Active Donations', '#active-donations'],
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
      [UserRoundCog, 'Profile', '#profile'],
      [Settings, 'Settings', '#settings']
    ],
    volunteer: [
      [LayoutDashboard, 'Dashboard', '#volunteer-home'],
      [MapPin, 'Available Pickups', '#available-pickups'],
      [Truck, 'Assigned Deliveries', '#assigned-deliveries'],
      [PackageCheck, 'Delivery History', '#delivery-history'],
      [MapPin, 'Navigation', '#navigation'],
      [Bell, 'Notifications', '#notifications'],
      [UserRoundCog, 'Profile', '#profile'],
      [Settings, 'Settings', '#settings']
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
  const roleLabel = titleCase(user?.role || 'user');
  const impactLabel = user?.role === 'donor'
    ? 'Impact: 420 Meals'
    : user?.role === 'ngo'
      ? 'Verified partner workspace'
      : user?.role === 'volunteer'
        ? 'Field operations workspace'
        : 'Platform command center';

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
    <div className={`app-dashboard app-dashboard-${user?.role || 'user'}`}>
      <aside className="dashboard-sidebar">
        <Link className="dashboard-brand" to="/">
          <svg className="dashboard-brand-svg" viewBox="0 0 52 52" width="44" height="44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            {/* Outer circle ring */}
            <circle cx="26" cy="26" r="24" stroke="#c5c0bb" strokeWidth="2.2" fill="none" />
            {/* Green segment (top-left) */}
            <path d="M26 2 A24 24 0 0 0 5.5 15 L16 20 Z" fill="#6db33f" />
            {/* Red segment (top-right) */}
            <path d="M26 2 A24 24 0 0 1 46.5 15 L36 20 Z" fill="#c0392b" />
            {/* Orange segment (bottom-right) */}
            <path d="M46.5 15 A24 24 0 0 1 46.5 38 L36 30 Z" fill="#e2973c" />
            {/* Brown/dark segment (bottom-left) */}
            <path d="M5.5 15 A24 24 0 0 0 5.5 38 L16 30 Z" fill="#6b4c2a" />
            {/* Inner white circle */}
            <circle cx="26" cy="26" r="14" fill="#fff" />
            {/* Heart icon in center */}
            <path d="M26 36 C20 30 15 26 15 22 C15 18.5 17.5 16 20.5 16 C22.5 16 24.5 17.5 26 19.5 C27.5 17.5 29.5 16 31.5 16 C34.5 16 37 18.5 37 22 C37 26 32 30 26 36Z" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="dashboard-brand-text">
            <span className="dashboard-brand-top">F O O D B R I D G E</span>
            <span className="dashboard-brand-bottom">NETWORK</span>
          </span>
        </Link>

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
        <div className="dashboard-side-footer">
          {user?.role === 'donor' && <a className="dashboard-donate-now" href="#donate-food"><Heart size={20} fill="currentColor" /> {t("Donate Now")}</a>}
          <a className="dashboard-support" href="#support"><HelpCircle size={18} /> {t("Support")}</a>
          <button className="dashboard-logout" onClick={logout}><LogOut size={18} /> {t("Logout")}</button>
        </div>
      </aside>

      <section className="dashboard-workspace">
        <header className="dashboard-topbar">
          <div className="dashboard-top-title">
            <h1>{user?.role === 'donor' ? t("Dashboard Overview") : t(title)}</h1>
          </div>
          <label className="dashboard-search" aria-label="Search dashboard">
            <Search size={22} />
            <input type="search" placeholder={t("Search activities...")} />
          </label>
          <div className="dashboard-top-actions">
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
            <button className="dashboard-help-button" type="button" aria-label="Help"><CircleHelp size={20} /></button>
            <span className="dashboard-action-divider" />
            {actions || (user?.role === 'donor' && <a className="button button-primary" href="#donate-food"><Plus size={18} /> {t("Donate Food")}</a>)}
            <div className="topbar-avatar">
              {user?.profile?.avatarUrl ? <img src={user.profile.avatarUrl} alt="" /> : <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80" alt="" />}
            </div>
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
  const homeTargets = {
    'dashboard-home': 1,
    'ngo-home': 1,
    'volunteer-home': 4,
    'admin-home': 3
  };

  if (targetId in homeTargets) return childArray.slice(0, homeTargets[targetId]);

  const filtered = childArray.map((child) => pruneToTarget(child, targetId)).filter(Boolean);
  return filtered.length ? filtered : childArray.slice(0, 1);
}

// Logo is now inline in the sidebar — DashboardBrandLogo removed intentionally

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
