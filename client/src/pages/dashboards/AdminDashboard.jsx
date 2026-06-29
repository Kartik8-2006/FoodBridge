import { api } from '../../api.js';
import { DashboardMapPanel, DashboardShell, DonationTable, NotificationList, QuickActions, StatGrid } from './DashboardParts.jsx';
import { useDashboardData } from './dashboardHooks.js';

export default function AdminDashboard() {
  const { data, error, refresh } = useDashboardData();
  if (!data) return <main className="dashboard"><p>{error || 'Loading admin dashboard...'}</p></main>;

  async function verify(id, status) {
    await api(`/admin/ngos/${id}/verification`, { method: 'PATCH', body: JSON.stringify({ status }) });
    refresh();
  }

  return (
    <DashboardShell eyebrow="Admin Dashboard" title="Platform operations and trust controls">
      <StatGrid stats={data.stats} />
      <QuickActions>
        <a href="#users">Users</a>
        <a href="#verification">NGO Verification</a>
        <a href="#donations">Donations</a>
        <a href="#analytics">Analytics</a>
      </QuickActions>
      <section className="panel">
        <h2>NGO Verification Queue</h2>
        {data.pendingNgos.map((ngo) => (
          <article className="queue-item" key={ngo._id}>
            <div><strong>{ngo.name}</strong><p>{ngo.email} · {ngo.profile?.serviceArea}</p></div>
            <div><button onClick={() => verify(ngo._id, 'verified')}>Verify</button><button onClick={() => verify(ngo._id, 'rejected')}>Reject</button></div>
          </article>
        ))}
        {!data.pendingNgos.length && <p>No pending NGO verifications.</p>}
      </section>
      <section className="panel"><h2>Recent Donations</h2><DonationTable donations={data.recentDonations} /></section>
      <DashboardMapPanel />
      <NotificationList items={data.notifications} />
    </DashboardShell>
  );
}
