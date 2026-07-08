import { useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, CheckCircle2, Clock, MapPin, PackageCheck, ShieldCheck, Truck, UserCheck, UsersRound, XCircle, Search, Mail, Phone, Plus, Calendar, Award, Soup, Info, Shield, RefreshCw, FileText, Settings, Bell, Check, Ban, Eye, Globe } from 'lucide-react';
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

function MiniBar({ label, value, max }) {
  const width = max ? Math.max(8, Math.round((Number(value || 0) / max) * 100)) : 8;
  return (
    <div className="admin-mini-bar" style={{ margin: '14px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
        <span style={{ color: '#4a5568' }}>{label}</span>
        <strong style={{ color: '#1a202c' }}>{value}</strong>
      </div>
      <div style={{ height: '8px', background: '#edf2f7', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${width}%`, background: 'linear-gradient(90deg, #ed8b00, #b87322)', borderRadius: '4px', transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data, error, refresh } = useDashboardData();
  const [message, setMessage] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [donationFilter, setDonationFilter] = useState('all');
  const [requestFilter, setRequestFilter] = useState('all');

  const analytics = data?.analytics || {};
  const categoryEntries = Object.entries(analytics.foodCategories || {});
  const maxCategory = Math.max(1, ...categoryEntries.map(([, value]) => Number(value || 0)));
  const users = data?.users || [];
  const ngos = data?.ngos || [];
  const volunteers = data?.volunteers || [];
  const currentDonations = data?.currentDonations || [];
  const recentDonations = data?.recentDonations || [];
  const queues = data?.verificationQueues || {};

  const overviewStats = useMemo(() => {
    if (!data?.stats) return {};
    const { totalUsers, todaysDonations, pendingPickups, mealsDelivered, foodRequests } = data.stats;
    return {
      'Total Users': totalUsers || 0,
      'Today\'s Donations': todaysDonations || 0,
      'Pending Pickups': pendingPickups || 0,
      'Meals Delivered': mealsDelivered || 0,
      'Food Requests': foodRequests || 0
    };
  }, [data]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      const matchesSearch = !userSearchQuery || 
        u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
        u.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.profile?.city?.toLowerCase().includes(userSearchQuery.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [users, userRoleFilter, userSearchQuery]);

  const filteredDonations = useMemo(() => {
    return recentDonations.filter((d) => {
      if (donationFilter === 'all') return true;
      return d.status === donationFilter;
    });
  }, [recentDonations, donationFilter]);

  if (!data) return <main className="dashboard"><p>{error || 'Loading admin dashboard...'}</p></main>;

  async function verify(id, status) {
    setMessage('');
    try {
      await api(`/admin/users/${id}/verification`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      setMessage(status === 'verified' ? 'Verification approved successfully.' : 'Verification rejected.');
      await refresh();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <DashboardShell eyebrow="Admin Dashboard" title="Platform operations, trust, and analytics">
      {/* Tab 1: Overview */}
      <section className="admin-hero" id="admin-home">
        <div>
          <span>Platform Overview</span>
          <h2>Control center for donations, verification, and operations.</h2>
          <p>Monitor real-time food rescue transactions, manage trusted partner status, and audit system events.</p>
        </div>
        <a href="#verification" style={{ cursor: 'pointer' }}><ShieldCheck size={18} /> Review Verifications</a>
      </section>

      <StatGrid stats={overviewStats} />

      <div className="admin-main-grid" data-dashboard-section="admin-home">
        {/* Activity Feed log */}
        <article className="admin-panel admin-feed" style={{ padding: '24px' }}>
          <div className="admin-panel-heading">
            <div>
              <span>Live Monitor</span>
              <h3>Activity & Audit Log</h3>
            </div>
            <Clock size={20} style={{ color: '#ed8b00' }} />
          </div>
          <div className="admin-feed-stack" style={{ marginTop: '16px' }}>
            {(data.activityFeed || []).map((item) => (
              <div className="admin-feed-item" key={item.id} style={{ display: 'flex', gap: '14px', padding: '12px 0', borderBottom: '1px solid #f0f2f5' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: item.status === 'audit' ? '#e2e8f0' : '#feebc8', color: item.status === 'audit' ? '#4a5568' : '#dd6b20', flexShrink: 0 }}>
                  {item.status === 'audit' ? <Shield size={16} /> : <Truck size={16} />}
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '14px', color: '#2d3748' }}>{item.text}</strong>
                  <small style={{ fontSize: '12px', color: '#718096' }}>{formatDate(item.createdAt)}</small>
                </div>
              </div>
            ))}
            {!data.activityFeed?.length && <p className="empty-state">No recent logs available.</p>}
          </div>
        </article>

        {/* Support & System health checklist */}
        <article className="admin-panel" style={{ padding: '24px' }}>
          <div className="admin-panel-heading">
            <div>
              <span>Security & Integrity</span>
              <h3>Platform Health Checks</h3>
            </div>
            <ShieldCheck size={20} style={{ color: '#48bb78' }} />
          </div>
          <div className="readiness-list" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '8px', background: '#f0fff4', color: '#276749', fontSize: '14px', fontWeight: '600' }}>
              <CheckCircle2 size={18} /> Role Access Controller Active
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '8px', background: '#f0fff4', color: '#276749', fontSize: '14px', fontWeight: '600' }}>
              <CheckCircle2 size={18} /> JWT Signature Validation Active
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '8px', background: '#fffaf0', color: '#7b341e', fontSize: '14px', fontWeight: '600' }}>
              <AlertTriangle size={18} /> {queues.ngos?.length || 0} NGO verification profiles pending
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '8px', background: '#edf2f7', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
              <Info size={18} /> {volunteers.length} Active field volunteers rescue operations
            </div>
          </div>
        </article>
      </div>

      {/* Tab 2: Users Directory */}
      <section className="admin-panel" id="users" data-dashboard-section="users">
        <div className="admin-panel-heading" style={{ borderBottom: '1px solid #edf2f7', paddingBottom: '16px' }}>
          <div>
            <span>Users Directory</span>
            <h3>Total Registered Accounts</h3>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#a0aec0' }} />
              <input 
                type="search" 
                placeholder="Search by name, email, city..." 
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                style={{ paddingLeft: '34px', minHeight: '36px', width: '220px', fontSize: '13px' }}
              />
            </div>
            <select 
              value={userRoleFilter} 
              onChange={(e) => setUserRoleFilter(e.target.value)}
              style={{ minHeight: '36px', padding: '0 10px', borderRadius: '8px', fontSize: '13px' }}
            >
              <option value="all">All Roles</option>
              <option value="donor">Donors</option>
              <option value="ngo">NGOs</option>
              <option value="volunteer">Volunteers</option>
            </select>
          </div>
        </div>

        <div className="dashboard-table-wrap" style={{ marginTop: '16px' }}>
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role Type</th>
                <th>Base Area / Organization</th>
                <th>Date Joined</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#edf2f7', display: 'grid', placeItems: 'center', fontWeight: 'bold', color: '#4a5568' }}>
                        {u.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '14px' }}>{u.name}</strong>
                        <small style={{ color: '#718096' }}>{u.email}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`status ${u.role === 'admin' ? 'danger' : 'neutral'}`} style={{ textTransform: 'uppercase', fontSize: '11px' }}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '13px' }}>
                      {u.role === 'donor' && (u.profile?.organizationName || u.profile?.foodSourceType || 'Individual')}
                      {u.role === 'ngo' && (u.profile?.organizationName || 'Community Kitchen')}
                      {u.role === 'volunteer' && (u.profile?.city || 'Local area')}
                      {u.role === 'admin' && 'System Admin'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '13px' }}>{formatDate(u.createdAt)}</span>
                  </td>
                  <td>
                    <span className="status" style={{ background: u.isActive === false ? '#fed7d7' : '#c6f6d5', color: u.isActive === false ? '#9b2c2c' : '#22543d', fontSize: '11px' }}>
                      {u.isActive === false ? 'INACTIVE' : 'ACTIVE'}
                    </span>
                  </td>
                </tr>
              ))}
              {!filteredUsers.length && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#718096' }}>No users match the search criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tab 3: Donations Log */}
      <section className="admin-panel" id="donations" data-dashboard-section="donations">
        <div className="admin-panel-heading" style={{ borderBottom: '1px solid #edf2f7', paddingBottom: '16px' }}>
          <div>
            <span>Platform Inventory</span>
            <h3>Real-time Donations Log</h3>
          </div>
          <select 
            value={donationFilter} 
            onChange={(e) => setDonationFilter(e.target.value)}
            style={{ minHeight: '36px', padding: '0 10px', borderRadius: '8px', fontSize: '13px' }}
          >
            <option value="all">All Statuses</option>
            <option value="posted">Posted (Unclaimed)</option>
            <option value="accepted">Accepted (In Progress)</option>
            <option value="picked_up">Picked Up</option>
            <option value="delivered">Delivered (Completed)</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <div className="dashboard-table-wrap" style={{ marginTop: '16px' }}>
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Donation Title</th>
                <th>Donor Name</th>
                <th>Recipient NGO</th>
                <th>Volunteers</th>
                <th>Est. Meals</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredDonations.map((d) => (
                <tr key={d._id}>
                  <td>
                    <strong style={{ display: 'block', fontSize: '14px' }}>{d.title}</strong>
                    <small style={{ color: '#718096' }}>{titleCase(d.foodType)} food</small>
                  </td>
                  <td>{d.donor?.name || 'Local Donor'}</td>
                  <td>{d.acceptedBy?.name || 'Not claimed yet'}</td>
                  <td>{d.assignedVolunteer?.name || 'Not assigned'}</td>
                  <td>{d.estimatedMeals} meals</td>
                  <td>
                    <span className="status" style={{
                      background: d.status === 'delivered' ? '#c6f6d5' : d.status === 'posted' ? '#ebf8ff' : '#feebc8',
                      color: d.status === 'delivered' ? '#22543d' : d.status === 'posted' ? '#2b6cb0' : '#c05621',
                      fontSize: '11px',
                      fontWeight: '700'
                    }}>
                      {d.status?.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
              {!filteredDonations.length && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#718096' }}>No donations available under this filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tab 4: Food Requests */}
      <section className="admin-panel" id="food-requests" data-dashboard-section="food-requests">
        <div className="admin-panel-heading">
          <div>
            <span>Community Demand</span>
            <h3>Pending Recipient Demands</h3>
          </div>
          <Soup size={20} style={{ color: '#ed8b00' }} />
        </div>
        <div style={{ padding: '12px 0', borderBottom: '1px solid #edf2f7', marginBottom: '16px', display: 'flex', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase' }}>Active Demand Requests</span>
            <strong style={{ display: 'block', fontSize: '24px', color: '#ed8b00' }}>{overviewStats['Food Requests']}</strong>
          </div>
        </div>
        <div className="readiness-list" style={{ display: 'grid', gap: '14px' }}>
          <div style={{ background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
            <h4 style={{ margin: '0 0 6px 0', color: '#2d3748', fontSize: '15px' }}>Route optimization matching algorithm</h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#4a5568', lineHeight: '1.5' }}>
              Pending food request metrics represent direct community demands flagged by non-profit entities. Platform dispatch automatically links volunteers near local pickup spots to matching surplus supplies.
            </p>
          </div>
        </div>
      </section>

      {/* Tab 5: Verification Queue */}
      <section className="admin-panel" id="verification" data-dashboard-section="verification">
        <div className="admin-panel-heading" style={{ borderBottom: '1px solid #edf2f7', paddingBottom: '16px' }}>
          <div>
            <span>Verification Queue</span>
            <h3>Approve or Reject Trusted Partners</h3>
          </div>
          <Shield size={20} style={{ color: '#ed8b00' }} />
        </div>

        <div className="admin-verification-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {/* NGO applications */}
          <article className="admin-panel" style={{ padding: '18px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: 'none' }}>
            <div className="admin-panel-heading">
              <div>
                <span>QUEUE</span>
                <h4 style={{ margin: 0 }}>NGO Verification</h4>
              </div>
              <span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' }}>{queues.ngos?.length || 0} pending</span>
            </div>
            <div className="admin-verification-stack" style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(queues.ngos || []).map((ngo) => (
                <div key={ngo._id} style={{ border: '1px solid #edf2f7', borderRadius: '8px', padding: '12px', background: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#ebf8ff', display: 'grid', placeItems: 'center', color: '#2b6cb0', fontWeight: 'bold' }}>N</div>
                    <div>
                      <strong style={{ fontSize: '13px', display: 'block' }}>{ngo.name}</strong>
                      <small style={{ color: '#718096', fontSize: '11px' }}>{ngo.email}</small>
                    </div>
                  </div>
                  <div className="admin-action-row" style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button style={{ flex: 1, minHeight: '28px', fontSize: '11px', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: '#48bb78', boxShadow: 'none' }} onClick={() => verify(ngo._id, 'verified')}>
                      <Check size={12} /> Approve
                    </button>
                    <button style={{ flex: 1, minHeight: '28px', fontSize: '11px', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: '#f56565', boxShadow: 'none' }} onClick={() => verify(ngo._id, 'rejected')}>
                      <Ban size={12} /> Reject
                    </button>
                  </div>
                </div>
              ))}
              {!queues.ngos?.length && <p className="empty-state" style={{ margin: '14px 0', fontSize: '12px' }}>No pending NGOs waiting.</p>}
            </div>
          </article>

          {/* Donor source applications */}
          <article className="admin-panel" style={{ padding: '18px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: 'none' }}>
            <div className="admin-panel-heading">
              <div>
                <span>QUEUE</span>
                <h4 style={{ margin: 0 }}>Donor Outlets</h4>
              </div>
              <span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' }}>{queues.restaurants?.length || 0} pending</span>
            </div>
            <div className="admin-verification-stack" style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(queues.restaurants || []).map((restaurant) => (
                <div key={restaurant._id} style={{ border: '1px solid #edf2f7', borderRadius: '8px', padding: '12px', background: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#fefcbf', display: 'grid', placeItems: 'center', color: '#b7791f', fontWeight: 'bold' }}>D</div>
                    <div>
                      <strong style={{ fontSize: '13px', display: 'block' }}>{restaurant.name}</strong>
                      <small style={{ color: '#718096', fontSize: '11px' }}>{restaurant.email}</small>
                    </div>
                  </div>
                  <div className="admin-action-row" style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button style={{ flex: 1, minHeight: '28px', fontSize: '11px', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: '#48bb78', boxShadow: 'none' }} onClick={() => verify(restaurant._id, 'verified')}>
                      <Check size={12} /> Approve
                    </button>
                    <button style={{ flex: 1, minHeight: '28px', fontSize: '11px', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: '#f56565', boxShadow: 'none' }} onClick={() => verify(restaurant._id, 'rejected')}>
                      <Ban size={12} /> Reject
                    </button>
                  </div>
                </div>
              ))}
              {!queues.restaurants?.length && <p className="empty-state" style={{ margin: '14px 0', fontSize: '12px' }}>No pending restaurants waiting.</p>}
            </div>
          </article>

          {/* Volunteer applications */}
          <article className="admin-panel" style={{ padding: '18px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: 'none' }}>
            <div className="admin-panel-heading">
              <div>
                <span>QUEUE</span>
                <h4 style={{ margin: 0 }}>Volunteers Docs</h4>
              </div>
              <span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' }}>{queues.volunteers?.length || 0} pending</span>
            </div>
            <div className="admin-verification-stack" style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(queues.volunteers || []).map((vol) => (
                <div key={vol._id} style={{ border: '1px solid #edf2f7', borderRadius: '8px', padding: '12px', background: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e6fffa', display: 'grid', placeItems: 'center', color: '#319795', fontWeight: 'bold' }}>V</div>
                    <div>
                      <strong style={{ fontSize: '13px', display: 'block' }}>{vol.name}</strong>
                      <small style={{ color: '#718096', fontSize: '11px' }}>{vol.email}</small>
                    </div>
                  </div>
                  <div className="admin-action-row" style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button style={{ flex: 1, minHeight: '28px', fontSize: '11px', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: '#48bb78', boxShadow: 'none' }} onClick={() => verify(vol._id, 'verified')}>
                      <Check size={12} /> Approve
                    </button>
                    <button style={{ flex: 1, minHeight: '28px', fontSize: '11px', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: '#f56565', boxShadow: 'none' }} onClick={() => verify(vol._id, 'rejected')}>
                      <Ban size={12} /> Reject
                    </button>
                  </div>
                </div>
              ))}
              {!queues.volunteers?.length && <p className="empty-state" style={{ margin: '14px 0', fontSize: '12px' }}>No pending volunteers waiting.</p>}
            </div>
          </article>
        </div>
      </section>

      {/* Tab 6: Analytics */}
      <section className="admin-panel" id="analytics" data-dashboard-section="analytics">
        <div className="admin-panel-heading" style={{ borderBottom: '1px solid #edf2f7', paddingBottom: '16px' }}>
          <div>
            <span>Analytics Dashboard</span>
            <h3>Throughput & Engagement Trends</h3>
          </div>
          <BarChart3 size={20} style={{ color: '#ed8b00' }} />
        </div>

        <div className="admin-analytics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', marginTop: '20px' }}>
          <article style={{ padding: '16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <span style={{ fontSize: '11px', color: '#718096', fontWeight: 'bold' }}>DAILY DONATIONS</span>
            <strong style={{ display: 'block', fontSize: '32px', color: '#1a202c', marginTop: '4px' }}>{analytics.dailyDonations || 0}</strong>
          </article>
          <article style={{ padding: '16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <span style={{ fontSize: '11px', color: '#718096', fontWeight: 'bold' }}>WEEKLY DONATIONS</span>
            <strong style={{ display: 'block', fontSize: '32px', color: '#1a202c', marginTop: '4px' }}>{analytics.weeklyDonations || 0}</strong>
          </article>
          <article style={{ padding: '16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <span style={{ fontSize: '11px', color: '#718096', fontWeight: 'bold' }}>MONTHLY DONATIONS</span>
            <strong style={{ display: 'block', fontSize: '32px', color: '#1a202c', marginTop: '4px' }}>{analytics.monthlyDonations || 0}</strong>
          </article>
        </div>

        {/* Most Active Partners widget & charts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginTop: '24px' }}>
          <article className="admin-panel" style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: 'none' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Network Champions</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderRadius: '8px', background: '#edf2f7' }}>
                <span style={{ color: '#4a5568', fontSize: '13px' }}>Most Active NGO</span>
                <strong style={{ color: '#2d3748', fontSize: '13px' }}>{analytics.mostActiveNgo || 'Pending activity'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderRadius: '8px', background: '#edf2f7' }}>
                <span style={{ color: '#4a5568', fontSize: '13px' }}>Most Active Donor</span>
                <strong style={{ color: '#2d3748', fontSize: '13px' }}>{analytics.mostActiveDonor || 'Pending activity'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderRadius: '8px', background: '#edf2f7' }}>
                <span style={{ color: '#4a5568', fontSize: '13px' }}>Most Active Volunteer</span>
                <strong style={{ color: '#2d3748', fontSize: '13px' }}>{analytics.mostActiveVolunteer || 'Pending activity'}</strong>
              </div>
            </div>
          </article>

          <article className="admin-panel" style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: 'none' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Donated Categories Distribution</h4>
            <div className="admin-category-chart">
              {categoryEntries.map(([label, value]) => <MiniBar key={label} label={titleCase(label)} value={value} max={maxCategory} />)}
              {!categoryEntries.length && <p className="empty-state">Category chart populates when donations are posted.</p>}
            </div>
          </article>
        </div>

        {/* Complaint reports */}
        <div style={{ marginTop: '24px' }}>
          <h4 style={{ margin: '0 0 14px 0', fontSize: '16px' }}>Risk & Complaint Monitoring</h4>
          <div className="admin-reports-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {(data.reports || []).map((report) => (
              <article className={reportStyles[report.type] || 'neutral'} key={report.type} style={{ padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff' }}>
                <strong style={{ display: 'block', fontSize: '14px', color: '#2d3748' }}>{report.type}</strong>
                <span style={{ display: 'block', fontSize: '28px', color: '#ed8b00', margin: '6px 0', fontWeight: 'bold' }}>{report.count}</span>
                <small style={{ fontSize: '12px', color: '#718096' }}>{report.status}</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Tab 7: Notifications */}
      <section id="notifications" data-dashboard-section="notifications">
        <NotificationList items={data.notifications} />
      </section>

      {/* Tab 8: Settings */}
      <section className="admin-panel" id="settings" data-dashboard-section="settings">
        <div className="admin-panel-heading" style={{ borderBottom: '1px solid #edf2f7', paddingBottom: '16px' }}>
          <div>
            <span>Platform Controls</span>
            <h3>System Settings & Policies</h3>
          </div>
          <Settings size={20} style={{ color: '#ed8b00' }} />
        </div>
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff' }}>
            <div>
              <strong style={{ display: 'block', fontSize: '14px', color: '#2d3748' }}>Role-Based Access Controls</strong>
              <small style={{ color: '#718096' }}>Enforce dashboard restrictions by user role level</small>
            </div>
            <span style={{ background: '#c6f6d5', color: '#22543d', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', alignSelf: 'center' }}>ACTIVE</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff' }}>
            <div>
              <strong style={{ display: 'block', fontSize: '14px', color: '#2d3748' }}>JWT Bearer Route Protections</strong>
              <small style={{ color: '#718096' }}>Sign API payloads to avoid request spoofing</small>
            </div>
            <span style={{ background: '#c6f6d5', color: '#22543d', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', alignSelf: 'center' }}>ACTIVE</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff' }}>
            <div>
              <strong style={{ display: 'block', fontSize: '14px', color: '#2d3748' }}>Platform Audit Log System</strong>
              <small style={{ color: '#718096' }}>Record administrator operations to backend audits database</small>
            </div>
            <span style={{ background: '#c6f6d5', color: '#22543d', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', alignSelf: 'center' }}>ACTIVE</span>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
