import { useState } from 'react';
import { api } from '../../api.js';
import { DashboardShell, DonationTable, NotificationList, QuickActions, StatGrid } from './DashboardParts.jsx';
import { useDashboardData } from './dashboardHooks.js';

export default function RecipientDashboard() {
  const { data, error, refresh } = useDashboardData();
  const [form, setForm] = useState({ householdSize: 1, location: '', need: '', urgency: 'this_week' });
  if (!data) return <main className="dashboard"><p>{error || 'Loading recipient dashboard...'}</p></main>;

  async function submit(event) {
    event.preventDefault();
    await api('/support-requests', { method: 'POST', body: JSON.stringify(form) });
    setForm({ householdSize: 1, location: '', need: '', urgency: 'this_week' });
    refresh();
  }

  return (
    <DashboardShell eyebrow="Recipient Dashboard" title="Request and track food support">
      <StatGrid stats={data.stats} />
      <QuickActions>
        <a href="#request-food">Request Food</a>
        <a href="#nearby-support">Nearby Support</a>
        <a href="#notifications">Notifications</a>
      </QuickActions>
      <section className="panel">
        <h2>Request Assistance</h2>
        <form className="compact-form" onSubmit={submit}>
          <input type="number" min="1" value={form.householdSize} onChange={(e) => setForm({ ...form, householdSize: e.target.value })} />
          <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
          <input placeholder="Food support needed" value={form.need} onChange={(e) => setForm({ ...form, need: e.target.value })} required />
          <select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}><option value="today">Today</option><option value="this_week">This week</option><option value="ongoing">Ongoing</option></select>
          <button>Submit</button>
        </form>
      </section>
      <section className="panel" id="nearby-support"><h2>Nearby Food Support</h2><DonationTable donations={data.availableSupport} /></section>
      <NotificationList items={data.notifications} />
    </DashboardShell>
  );
}
