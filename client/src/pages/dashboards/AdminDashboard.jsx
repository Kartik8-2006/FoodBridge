import { useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, CheckCircle2, Clock, MapPin, PackageCheck, ShieldCheck, Truck, UserCheck, UsersRound, XCircle } from 'lucide-react';
import { api } from '../../api.js';
import { formatDate, titleCase } from '../../utils.js';
import { DashboardShell, NotificationList, StatGrid } from './DashboardParts.jsx';
import { useDashboardData } from './dashboardHooks.js';

const reportStyles = {
  Spam: 'warning',
  'Expired Food': 'danger',
  'Fake NGO': 'danger',
  'User Complaints': 'neutral'
};

function VerificationList({ title, items = [], onVerify }) {
  return (
    <article className="admin-panel verification-list">
      <div className="admin-panel-heading">
        <div>
          <span>Verification</span>
          <h3>{title}</h3>
        </div>
        <strong>{items.length}</strong>
      </div>
      <div className="admin-verification-stack">
        {items.map((item) => (
          <div className="admin-verification-card" key={item._id}>
            <div className="admin-identity">
              <span>{item.name?.charAt(0) || 'U'}</span>
              <div>
                <strong>{item.name}</strong>
                <small>{item.email}</small>
              </div>
            </div>
            <div className="admin-verification-meta">
              <span>{titleCase(item.role)}</span>
              <span>{titleCase(item.profile?.verificationStatus || 'pending')}</span>
            </div>
            <div className="admin-action-row">
              <button onClick={() => onVerify(item._id, 'verified')}><CheckCircle2 size={16} /> Approve</button>
              <button className="danger" onClick={() => onVerify(item._id, 'rejected')}><XCircle size={16} /> Reject</button>
            </div>
          </div>
        ))}
        {!items.length && <p className="empty-state">No pending records in this queue.</p>}
      </div>
    </article>
  );
}

function MiniBar({ label, value, max }) {
  const width = max ? Math.max(8, Math.round((Number(value || 0) / max) * 100)) : 8;
  return (
    <div className="admin-mini-bar">
      <div><span>{label}</span><strong>{value}</strong></div>
      <i><b style={{ width: `${width}%` }} /></i>
    </div>
  );
}

export default function AdminDashboard() {
  const { data, error, refresh } = useDashboardData();
  const [message, setMessage] = useState('');

  const analytics = data?.analytics || {};
  const categoryEntries = Object.entries(analytics.foodCategories || {});
  const maxCategory = Math.max(1, ...categoryEntries.map(([, value]) => Number(value || 0)));
  const users = data?.users || [];
  const donors = users.filter((user) => user.role === 'donor');
  const ngos = data?.ngos || [];
  const volunteers = data?.volunteers || [];
  const currentDonations = data?.currentDonations || [];
  const queues = data?.verificationQueues || {};

  const overviewStats = useMemo(() => data?.stats || {}, [data]);

  if (!data) return <main className="dashboard"><p>{error || 'Loading admin dashboard...'}</p></main>;

  async function verify(id, status) {
    setMessage('');
    try {
      await api(`/admin/users/${id}/verification`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      setMessage(status === 'verified' ? 'Verification approved and user notified.' : 'Verification rejected and user notified.');
      refresh();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <DashboardShell eyebrow="Admin Dashboard" title="Platform operations, trust, and analytics">
      <section className="admin-hero" id="admin-home">
        <div>
          <span>Platform Overview</span>
          <h2>Control center for donations, users, verification, and field activity.</h2>
          <p>Monitor live food movement, approve trusted partners, review reports, and keep every role accountable from one workspace.</p>
        </div>
        <a href="#verification"><ShieldCheck size={18} /> Review Verification</a>
      </section>

      <StatGrid stats={overviewStats} />
      {message && <div className="notice">{message}</div>}

      <section className="admin-main-grid">
        <article className="admin-panel admin-map-panel">
          <div className="admin-panel-heading">
            <div>
              <span>Live Map</span>
              <h3>Current network activity</h3>
            </div>
            <MapPin size={20} />
          </div>
          <div className="admin-map">
            <span className="admin-map-pin donation">Current Donations</span>
            <span className="admin-map-pin volunteer">Volunteer Locations</span>
            <span className="admin-map-pin ngo">NGOs</span>
            <span className="admin-map-pin heat">Heatmap</span>
          </div>
          <div className="admin-map-metrics">
            <div><strong>{currentDonations.length}</strong><span>Current Donations</span></div>
            <div><strong>{volunteers.length}</strong><span>Volunteer Locations</span></div>
            <div><strong>{ngos.length}</strong><span>NGO Centers</span></div>
          </div>
        </article>

        <article className="admin-panel admin-feed">
          <div className="admin-panel-heading">
            <div>
              <span>Activity Feed</span>
              <h3>Latest platform events</h3>
            </div>
            <Clock size={20} />
          </div>
          <div className="admin-feed-stack">
            {(data.activityFeed || []).map((item) => (
              <div className="admin-feed-item" key={item.id}>
                <i />
                <div>
                  <strong>{item.text}</strong>
                  <small>{titleCase(item.status)} - {formatDate(item.createdAt)}</small>
                </div>
              </div>
            ))}
            {!data.activityFeed?.length && <p className="empty-state">No platform activity yet.</p>}
          </div>
        </article>
      </section>

      <section className="admin-panel" id="analytics">
        <div className="admin-panel-heading">
          <div>
            <span>Analytics</span>
            <h3>Donation trends and most active partners</h3>
          </div>
          <BarChart3 size={20} />
        </div>
        <div className="admin-analytics-grid">
          <article><span>Daily Donations</span><strong>{analytics.dailyDonations || 0}</strong></article>
          <article><span>Weekly Donations</span><strong>{analytics.weeklyDonations || 0}</strong></article>
          <article><span>Monthly Donations</span><strong>{analytics.monthlyDonations || 0}</strong></article>
          <article><span>Most Active NGO</span><strong>{analytics.mostActiveNgo || 'Pending activity'}</strong></article>
          <article><span>Most Active Donor</span><strong>{analytics.mostActiveDonor || 'Pending activity'}</strong></article>
          <article><span>Most Active Volunteer</span><strong>{analytics.mostActiveVolunteer || 'Pending activity'}</strong></article>
        </div>
        <div className="admin-category-chart">
          {categoryEntries.map(([label, value]) => <MiniBar key={label} label={titleCase(label)} value={value} max={maxCategory} />)}
          {!categoryEntries.length && <p className="empty-state">Food category chart will populate after donations are created.</p>}
        </div>
      </section>

      <section className="admin-directory-grid">
        <article className="admin-panel" id="users">
          <div className="admin-panel-heading"><div><span>Users</span><h3>Total registered users</h3></div><UsersRound size={20} /></div>
          <div className="admin-compact-list">
            {users.slice(0, 6).map((user) => <p key={user._id}><strong>{user.name}</strong><span>{titleCase(user.role)} - {user.email}</span></p>)}
          </div>
        </article>
        <article className="admin-panel" id="donors">
          <div className="admin-panel-heading"><div><span>Donors</span><h3>Donation sources</h3></div><PackageCheck size={20} /></div>
          <div className="admin-compact-list">
            {donors.slice(0, 6).map((user) => <p key={user._id}><strong>{user.name}</strong><span>{titleCase(user.profile?.foodSourceType || 'food donor')}</span></p>)}
          </div>
        </article>
        <article className="admin-panel" id="ngos">
          <div className="admin-panel-heading"><div><span>NGOs</span><h3>Receiving partners</h3></div><UserCheck size={20} /></div>
          <div className="admin-compact-list">
            {ngos.slice(0, 6).map((user) => <p key={user._id}><strong>{user.name}</strong><span>{titleCase(user.profile?.verificationStatus || 'pending')}</span></p>)}
          </div>
        </article>
        <article className="admin-panel" id="volunteers">
          <div className="admin-panel-heading"><div><span>Volunteers</span><h3>Field workforce</h3></div><Truck size={20} /></div>
          <div className="admin-compact-list">
            {volunteers.slice(0, 6).map((user) => <p key={user._id}><strong>{user.name}</strong><span>{titleCase(user.profile?.verificationStatus || 'not required')}</span></p>)}
          </div>
        </article>
      </section>

      <section className="admin-panel" id="donations">
        <div className="admin-panel-heading">
          <div>
            <span>Donations</span>
            <h3>Current donations and pickup state</h3>
          </div>
          <PackageCheck size={20} />
        </div>
        <div className="admin-donation-grid">
          {currentDonations.map((donation) => (
            <article key={donation._id}>
              <strong>{donation.title}</strong>
              <p>{donation.donor?.name || 'Unknown donor'} - {donation.city}</p>
              <span>{titleCase(donation.status)}</span>
              <small>{donation.estimatedMeals} meals - Safe before {formatDate(donation.safeBefore)}</small>
            </article>
          ))}
          {!currentDonations.length && <p className="empty-state">No active donations are waiting right now.</p>}
        </div>
      </section>

      <section className="admin-panel" id="food-requests">
        <div className="admin-panel-heading">
          <div>
            <span>Food Requests</span>
            <h3>Pending community demand</h3>
          </div>
          <AlertTriangle size={20} />
        </div>
        <div className="admin-reports-grid">
          <article><strong>Open Requests</strong><span>{overviewStats.foodRequests || 0}</span><small>Recipient and NGO requests</small></article>
          <article><strong>Needs Matching</strong><span>{overviewStats.pendingPickups || 0}</span><small>Can be routed to available donations</small></article>
        </div>
      </section>

      <section className="admin-verification-grid" id="verification">
        <VerificationList title="NGOs" items={queues.ngos || []} onVerify={verify} />
        <VerificationList title="Restaurants and Donors" items={queues.restaurants || []} onVerify={verify} />
        <VerificationList title="Volunteer Documents" items={queues.volunteers || []} onVerify={verify} />
      </section>

      <section className="admin-panel" id="reports">
        <div className="admin-panel-heading">
          <div>
            <span>Reports</span>
            <h3>Risk and complaint monitoring</h3>
          </div>
          <AlertTriangle size={20} />
        </div>
        <div className="admin-reports-grid">
          {(data.reports || []).map((report) => (
            <article className={reportStyles[report.type] || 'neutral'} key={report.type}>
              <strong>{report.type}</strong>
              <span>{report.count}</span>
              <small>{report.status}</small>
            </article>
          ))}
        </div>
      </section>

      <NotificationList items={data.notifications} />

      <section className="admin-panel" id="settings">
        <div className="admin-panel-heading">
          <div>
            <span>Settings</span>
            <h3>Operational guardrails</h3>
          </div>
        </div>
        <div className="admin-settings-row">
          <span>Role based authorization active</span>
          <span>JWT protected APIs</span>
          <span>Admin audit logs enabled</span>
        </div>
      </section>
    </DashboardShell>
  );
}
