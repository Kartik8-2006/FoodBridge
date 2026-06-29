import { useMemo, useState } from 'react';
import { Camera, CheckCircle2, Clock, ImagePlus, MapPin, PackageCheck, Phone, Plus, Truck, UserCheck } from 'lucide-react';
import { api } from '../../api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatDate, titleCase } from '../../utils.js';
import { DashboardShell, NotificationList, StatGrid } from './DashboardParts.jsx';
import { useDashboardData } from './dashboardHooks.js';

const statusSteps = [
  ['posted', 'Donation Created'],
  ['accepted', 'NGO Accepted'],
  ['pickup_scheduled', 'Volunteer Assigned'],
  ['picked_up', 'Picked Up'],
  ['delivered', 'Delivered']
];

const initialForm = {
  title: '',
  quantity: '',
  estimatedMeals: 20,
  foodType: 'cooked',
  dietType: 'veg',
  safeBefore: '',
  pickupAddress: '',
  city: '',
  contactNumber: '',
  storageInstructions: '',
  allergenNotes: '',
  imageUrl: ''
};

export default function DonorDashboard() {
  const { user } = useAuth();
  const { data, error, refresh } = useDashboardData();
  const [form, setForm] = useState(initialForm);
  const [selectedDonationId, setSelectedDonationId] = useState('');
  const [formMessage, setFormMessage] = useState('');

  const donations = data?.donations || [];
  const selectedDonation = donations.find((item) => item._id === selectedDonationId) || donations[0];

  const activeDonations = donations.filter((item) => ['posted', 'accepted', 'pickup_scheduled', 'picked_up'].includes(item.status));
  const donationHistory = donations.filter((item) => ['delivered', 'cancelled', 'expired'].includes(item.status));

  const quickStats = useMemo(() => {
    const totalMeals = donations.reduce((sum, item) => sum + Number(item.estimatedMeals || 0), 0);
    const foodSavedKg = donations.reduce((sum, item) => {
      const number = Number(String(item.quantity || '').match(/\d+/)?.[0] || 0);
      return sum + number;
    }, 0);
    const ngosHelped = new Set(donations.map((item) => item.acceptedBy?._id || item.acceptedBy).filter(Boolean)).size;
    const volunteersAssigned = donations.filter((item) => item.assignedVolunteer).length;

    return [
      ['Total Donations', donations.length],
      ['Food Saved (kg)', foodSavedKg || 'Pending'],
      ['Meals Provided', totalMeals],
      ['NGOs Helped', ngosHelped],
      ['Volunteers Assigned', volunteersAssigned],
      ['Average Pickup Time', donations.length ? '2.4 hrs' : 'Pending']
    ];
  }, [donations]);

  if (!data) return <main className="dashboard"><p>{error || 'Loading donor dashboard...'}</p></main>;

  function update(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function updateImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 650000) {
      setFormMessage('Image is too large. Please upload an image under 650 KB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, imageUrl: reader.result }));
    reader.readAsDataURL(file);
  }

  async function submitDonation(event) {
    event.preventDefault();
    setFormMessage('');

    const now = new Date();
    const pickupStart = new Date(now.getTime() + 30 * 60 * 1000);
    const pickupEnd = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    try {
      await api('/donations', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          estimatedMeals: Number(form.estimatedMeals),
          pickupWindowStart: pickupStart.toISOString(),
          pickupWindowEnd: pickupEnd.toISOString()
        })
      });
      setForm(initialForm);
      setFormMessage('Donation created. NGOs and volunteers have been notified.');
      refresh();
    } catch (err) {
      setFormMessage(err.message);
    }
  }

  return (
    <DashboardShell eyebrow="Donor Dashboard" title="Food donation workspace" actions={<a className="button button-primary" href="#donate-food"><Plus size={17} /> Donate Food</a>}>
      <section className="donor-hero" id="dashboard-home">
        <div>
          <p>Hello, {user?.name || 'Donor'}</p>
          <h2>Ready to help someone today?</h2>
        </div>
        <a href="#donate-food"><Plus size={18} /> Donate Food</a>
      </section>

      <StatGrid stats={data.stats} />

      <section className="donor-dashboard-grid">
        <article className="donor-panel large" id="active-donations">
          <div className="panel-heading">
            <div>
              <p className="dashboard-kicker">Recent Donations</p>
              <h2>My Active Donations</h2>
            </div>
            <span>{activeDonations.length} active</span>
          </div>
          <div className="donor-donation-list">
            {activeDonations.map((donation) => (
              <button
                className={selectedDonation?._id === donation._id ? 'donor-donation-card selected' : 'donor-donation-card'}
                key={donation._id}
                type="button"
                onClick={() => setSelectedDonationId(donation._id)}
              >
                {donation.imageUrl ? <img src={donation.imageUrl} alt="" /> : <PackageCheck />}
                <span>
                  <strong>{donation.title}</strong>
                  <small>{donation.quantity} · {donation.city}</small>
                  <small>{donation.acceptedBy ? 'NGO Accepted' : 'Waiting for NGO'}</small>
                </span>
                <em>{titleCase(donation.status)}</em>
              </button>
            ))}
            {!activeDonations.length && <p>No active donations yet. Create one from the Donate Food form.</p>}
          </div>
        </article>

        <article className="donor-panel" id="track-donations">
          <div className="panel-heading">
            <div>
              <p className="dashboard-kicker">Track Donation</p>
              <h2>{selectedDonation?.title || 'No donation selected'}</h2>
            </div>
          </div>
          <DonationTimeline donation={selectedDonation} />
        </article>
      </section>

      <section className="donor-dashboard-grid">
        <article className="donor-panel large" id="donate-food">
          <div className="panel-heading">
            <div>
              <p className="dashboard-kicker">Donate Food</p>
              <h2>Create a pickup-ready donation</h2>
            </div>
          </div>
          <form className="donor-form" onSubmit={submitDonation}>
            <div className="two-col">
              <label>Food Name<input name="title" value={form.title} onChange={update} placeholder="Rice meal, chapati, fruit boxes" required /></label>
              <label>Quantity<input name="quantity" value={form.quantity} onChange={update} placeholder="25 kg or 80 packets" required /></label>
            </div>
            <div className="two-col">
              <label>Veg / Non Veg
                <select name="dietType" value={form.dietType} onChange={update}>
                  <option value="veg">Veg</option>
                  <option value="non-veg">Non Veg</option>
                  <option value="vegan">Vegan</option>
                  <option value="mixed">Mixed</option>
                </select>
              </label>
              <label>Food Type
                <select name="foodType" value={form.foodType} onChange={update}>
                  <option value="cooked">Cooked</option>
                  <option value="raw">Raw</option>
                  <option value="packaged">Packaged</option>
                  <option value="bakery">Bakery</option>
                  <option value="produce">Produce</option>
                  <option value="mixed">Mixed</option>
                </select>
              </label>
            </div>
            <div className="two-col">
              <label>Estimated Meals<input name="estimatedMeals" type="number" min="1" value={form.estimatedMeals} onChange={update} required /></label>
              <label>Expiry / Safe Before<input name="safeBefore" type="datetime-local" value={form.safeBefore} onChange={update} required /></label>
            </div>
            <label>Pickup Address<input name="pickupAddress" value={form.pickupAddress} onChange={update} placeholder="Full pickup address" required /></label>
            <div className="two-col">
              <label>City<input name="city" value={form.city} onChange={update} placeholder="Bengaluru" required /></label>
              <label>Contact Number<input name="contactNumber" value={form.contactNumber} onChange={update} placeholder="+91 98765 43210" required /></label>
            </div>
            <div className="two-col">
              <label>Storage Instructions<textarea name="storageInstructions" value={form.storageInstructions} onChange={update} placeholder="Keep warm, refrigerated, sealed packets..." /></label>
              <label>Allergen Notes<textarea name="allergenNotes" value={form.allergenNotes} onChange={update} placeholder="Contains dairy, wheat, nuts..." /></label>
            </div>
            <div className="donor-form-extras">
              <label className="image-upload">
                {form.imageUrl ? <img src={form.imageUrl} alt="Donation preview" /> : <ImagePlus />}
                <span><Camera size={16} /> Image Upload</span>
                <input type="file" accept="image/*" onChange={updateImage} />
              </label>
              <div className="mini-map">
                {form.pickupAddress ? (
                  <iframe
                    title="Pickup address map"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(`${form.pickupAddress} ${form.city}`)}&output=embed`}
                  />
                ) : (
                  <>
                    <MapPin />
                    <strong>Google Map</strong>
                    <span>Pickup location preview appears here</span>
                  </>
                )}
              </div>
            </div>
            {formMessage && <div className="notice">{formMessage}</div>}
            <button className="donor-submit"><Plus size={18} /> Submit Donation</button>
          </form>
        </article>

        <article className="donor-panel">
          <div className="panel-heading">
            <div>
              <p className="dashboard-kicker">Quick Statistics</p>
              <h2>Donation Analytics</h2>
            </div>
          </div>
          <div className="quick-stat-list">
            {quickStats.map(([label, value]) => (
              <div key={label}><span>{label}</span><strong>{value}</strong></div>
            ))}
          </div>
        </article>
      </section>

      <section className="donor-dashboard-grid">
        <article className="donor-panel" id="donation-history">
          <div className="panel-heading">
            <div>
              <p className="dashboard-kicker">Donation History</p>
              <h2>Completed and closed donations</h2>
            </div>
          </div>
          <div className="history-list">
            {(donationHistory.length ? donationHistory : donations).map((donation) => (
              <div key={donation._id}>
                <strong>{donation.title}</strong>
                <span>{titleCase(donation.status)} · {formatDate(donation.safeBefore)}</span>
                <button type="button" onClick={() => setSelectedDonationId(donation._id)}>View Details</button>
              </div>
            ))}
          </div>
        </article>

        <article className="donor-panel">
          <div className="panel-heading">
            <div>
              <p className="dashboard-kicker">Recent Activity</p>
              <h2>Timeline</h2>
            </div>
          </div>
          <ActivityTimeline donation={selectedDonation} />
        </article>
      </section>

      <section id="notifications"><NotificationList items={data.notifications} /></section>

      <section className="donor-dashboard-grid">
        <article className="donor-panel" id="profile">
          <h2>Profile</h2>
          <p><UserCheck size={17} /> {user?.name}</p>
          <p><Phone size={17} /> {user?.profile?.phone || 'Phone not added'}</p>
          <p><MapPin size={17} /> {user?.profile?.city || 'City not added'}</p>
        </article>
        <article className="donor-panel" id="settings">
          <h2>Settings</h2>
          <p>Notification preferences, pickup contact details, and donor verification settings will be managed here.</p>
        </article>
      </section>
    </DashboardShell>
  );
}

function DonationTimeline({ donation }) {
  if (!donation) return <p>No donation available for tracking.</p>;

  const activeIndex = Math.max(0, statusSteps.findIndex(([status]) => status === donation.status));

  return (
    <div className="donation-timeline beautiful">
      {statusSteps.map(([status, label], index) => (
        <div className={index <= activeIndex ? 'complete' : ''} key={status}>
          <span>{index <= activeIndex ? <CheckCircle2 size={16} /> : <Clock size={16} />}</span>
          <div>
            <strong>{label}</strong>
            <small>{index <= activeIndex ? 'Completed or in progress' : 'Waiting'}</small>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityTimeline({ donation }) {
  if (!donation) return <p>Create a donation to see activity.</p>;

  const activeIndex = Math.max(0, statusSteps.findIndex(([status]) => status === donation.status));
  return (
    <div className="activity-timeline">
      {statusSteps.map(([, label], index) => (
        <div className={index <= activeIndex ? 'done' : ''} key={label}>
          <span>✓</span>
          <p>{label}</p>
        </div>
      ))}
      {donation.status === 'accepted' && (
        <div className="done"><span>✓</span><p>Volunteer Assigned</p></div>
      )}
    </div>
  );
}
