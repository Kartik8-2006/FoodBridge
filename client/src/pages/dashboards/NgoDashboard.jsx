import { useMemo, useState } from 'react';
import { CheckCircle2, Clock, Home, MapPin, PackageCheck, School, Soup, Truck, UsersRound } from 'lucide-react';
import { api } from '../../api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatDate, titleCase } from '../../utils.js';
import { DashboardShell, NotificationList, StatGrid } from './DashboardParts.jsx';
import { useDashboardData } from './dashboardHooks.js';

const claimSteps = [
  ['accepted', 'Accept'],
  ['pickup_scheduled', 'Volunteer Assigned'],
  ['picked_up', 'Track Volunteer'],
  ['delivered', 'Receive Food'],
  ['delivered', 'Mark Delivered']
];

const beneficiaries = [
  ['Families', 'families', UsersRound],
  ['Shelters', 'shelters', Home],
  ['Schools', 'schools', School],
  ['Old Age Homes', 'old_age_homes', UsersRound],
  ['Orphanages', 'orphanages', Home],
  ['Community Kitchens', 'community_kitchens', Soup]
];

export default function NgoDashboard() {
  const { user } = useAuth();
  const { data, error, refresh } = useDashboardData();
  const [selectedDonationId, setSelectedDonationId] = useState('');
  const [deliveryTarget, setDeliveryTarget] = useState('families');
  const [beneficiaryCount, setBeneficiaryCount] = useState(40);
  const [message, setMessage] = useState('');

  const availableDonations = data?.availableDonations || [];
  const claimedDonations = data?.acceptedDonations || [];
  const selectedDonation =
    claimedDonations.find((item) => item._id === selectedDonationId) ||
    claimedDonations[0] ||
    availableDonations[0];

  const reportCards = useMemo(() => {
    const reports = data?.reports || {};
    return [
      ['Meals Distributed', reports.mealsDistributed || 0],
      ['Food Received', reports.foodReceived || 0],
      ['Average Delivery Time', reports.averageDeliveryTime || 'Pending'],
      ['Monthly Analytics', reports.monthlyAnalytics || 0]
    ];
  }, [data]);

  if (!data) return <main className="dashboard"><p>{error || 'Loading NGO dashboard...'}</p></main>;

  async function accept(id) {
    setMessage('');
    try {
      await api(`/donations/${id}/accept`, { method: 'PATCH' });
      setSelectedDonationId(id);
      setMessage('Donation claimed. Assign a volunteer and track pickup progress.');
      refresh();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function markPickedUp(id) {
    setMessage('');
    try {
      await api(`/donations/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'picked_up' })
      });
      setMessage('Volunteer pickup confirmed. Track delivery until received.');
      refresh();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function markDelivered(id) {
    setMessage('');
    try {
      await api(`/donations/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'delivered',
          distributionTarget: deliveryTarget,
          beneficiaryCount: Number(beneficiaryCount)
        })
      });
      setMessage('Food received and marked delivered. Beneficiary report updated.');
      refresh();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <DashboardShell eyebrow="NGO Dashboard" title="Food receiving and distribution center">
      <section className="ngo-hero" id="ngo-home">
        <div>
          <p>Hello {user?.name || 'NGO'} 👋</p>
          <h2>Nearby donations available</h2>
        </div>
        <a href="#available-donations">Claim Now</a>
      </section>

      <section className="ngo-summary-grid">
        <article><span>Nearby Donations Available</span><strong>{availableDonations.length}</strong><small>Active donations</small></article>
        <article><span>Food Requests Pending</span><strong>{data.stats.openRequests}</strong><small>Requests from recipients</small></article>
        <article><span>Today's Distribution</span><strong>{data.stats.todaysDistribution || 0}</strong><small>Meals</small></article>
      </section>

      <StatGrid stats={data.stats} />

      {message && <div className="notice">{message}</div>}

      <section className="ngo-dashboard-grid">
        <article className="ngo-panel large" id="available-donations">
          <div className="panel-heading">
            <div>
              <p className="dashboard-kicker">Available Donations</p>
              <h2>Claim nearby food donations</h2>
            </div>
            <span>{availableDonations.length} available</span>
          </div>
          <div className="ngo-card-grid">
            {availableDonations.map((donation, index) => (
              <DonationClaimCard
                donation={donation}
                distance={`${(index + 1) * 1.8} km`}
                key={donation._id}
                onAccept={() => accept(donation._id)}
              />
            ))}
            {!availableDonations.length && <p>No available donations right now.</p>}
          </div>
        </article>

        <article className="ngo-panel" id="claim-workflow">
          <div className="panel-heading">
            <div>
              <p className="dashboard-kicker">Claim Donation</p>
              <h2>{selectedDonation?.title || 'Select a donation'}</h2>
            </div>
          </div>
          <ClaimTimeline donation={selectedDonation} />
          {selectedDonation && selectedDonation.acceptedBy && (
            <div className="claim-actions">
              <button type="button" onClick={() => markPickedUp(selectedDonation._id)} disabled={selectedDonation.status === 'delivered'}>
                <Truck size={16} /> Track Volunteer
              </button>
              <button type="button" onClick={() => markDelivered(selectedDonation._id)} disabled={selectedDonation.status === 'delivered'}>
                <CheckCircle2 size={16} /> Mark Delivered
              </button>
            </div>
          )}
        </article>
      </section>

      <section className="ngo-dashboard-grid">
        <article className="ngo-panel large" id="claimed-donations">
          <div className="panel-heading">
            <div>
              <p className="dashboard-kicker">Claimed Donations</p>
              <h2>Accepted and in-progress donations</h2>
            </div>
          </div>
          <div className="claimed-list">
            {claimedDonations.map((donation) => (
              <button
                className={selectedDonation?._id === donation._id ? 'claimed-row selected' : 'claimed-row'}
                key={donation._id}
                type="button"
                onClick={() => setSelectedDonationId(donation._id)}
              >
                <span><strong>{donation.title}</strong><small>{donation.donor?.name || 'Food donor'} · {donation.quantity}</small></span>
                <em>{titleCase(donation.status)}</em>
              </button>
            ))}
            {!claimedDonations.length && <p>No claimed donations yet. Accept one from Available Donations.</p>}
          </div>
        </article>

        <article className="ngo-panel" id="volunteers">
          <div className="panel-heading">
            <div>
              <p className="dashboard-kicker">Volunteers</p>
              <h2>Pickup coordination</h2>
            </div>
          </div>
          <div className="volunteer-track-card">
            <Truck />
            <strong>{selectedDonation?.assignedVolunteer?.name || 'Volunteer assignment pending'}</strong>
            <span>{selectedDonation?.status ? titleCase(selectedDonation.status) : 'Waiting for claimed donation'}</span>
          </div>
        </article>
      </section>

      <section className="ngo-dashboard-grid">
        <article className="ngo-panel large" id="beneficiaries">
          <div className="panel-heading">
            <div>
              <p className="dashboard-kicker">Beneficiaries</p>
              <h2>Track where food went</h2>
            </div>
          </div>
          <div className="beneficiary-grid">
            {beneficiaries.map(([label, value, Icon]) => (
              <button
                className={deliveryTarget === value ? 'selected' : ''}
                key={value}
                type="button"
                onClick={() => setDeliveryTarget(value)}
              >
                <Icon size={22} />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <label className="beneficiary-input">
            Beneficiaries served
            <input type="number" min="0" value={beneficiaryCount} onChange={(event) => setBeneficiaryCount(event.target.value)} />
          </label>
        </article>

        <article className="ngo-panel" id="food-requests">
          <div className="panel-heading">
            <div>
              <p className="dashboard-kicker">Food Requests</p>
              <h2>Pending needs</h2>
            </div>
          </div>
          <div className="food-request-list">
            {(data.foodRequests || []).map((request) => (
              <div key={request._id}>
                <strong>{request.need}</strong>
                <span>{request.location} · {request.householdSize} people · {titleCase(request.urgency)}</span>
              </div>
            ))}
            {!data.foodRequests?.length && <p>No pending food requests.</p>}
          </div>
        </article>
      </section>

      <section className="ngo-panel" id="reports">
        <div className="panel-heading">
          <div>
            <p className="dashboard-kicker">Reports</p>
            <h2>Distribution analytics</h2>
          </div>
        </div>
        <div className="ngo-report-grid">
          {reportCards.map(([label, value]) => (
            <article key={label}><span>{label}</span><strong>{value}</strong></article>
          ))}
        </div>
      </section>

      <section className="ngo-panel ngo-map-panel">
        <div>
          <p className="dashboard-kicker">Google Maps Integration</p>
          <h2>Pickup location map</h2>
        </div>
        <div className="ngo-map">
          {selectedDonation?.pickupAddress ? (
            <iframe
              title="Donation pickup map"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(`${selectedDonation.pickupAddress} ${selectedDonation.city}`)}&output=embed`}
            />
          ) : (
            <><MapPin /><span>Select a donation to preview pickup location.</span></>
          )}
        </div>
      </section>

      <section id="notifications"><NotificationList items={data.notifications} /></section>

      <section className="ngo-panel" id="profile">
        <h2>Profile</h2>
        <p>{user?.name} · {user?.profile?.serviceArea || user?.profile?.city || 'Service area not set'}</p>
      </section>
    </DashboardShell>
  );
}

function DonationClaimCard({ donation, distance, onAccept }) {
  return (
    <article className="ngo-donation-card">
      {donation.imageUrl ? <img src={donation.imageUrl} alt="" /> : <div className="ngo-food-placeholder"><PackageCheck /></div>}
      <div>
        <span className="food-type">{titleCase(donation.foodType)} · {titleCase(donation.dietType)}</span>
        <h3>{donation.title}</h3>
        <p>{donation.donor?.profile?.organizationName || donation.donor?.name || 'Registered food donor'}</p>
        <dl>
          <div><dt>Distance</dt><dd>{distance}</dd></div>
          <div><dt>Quantity</dt><dd>{donation.quantity}</dd></div>
          <div><dt>Pickup Time</dt><dd>{formatDate(donation.pickupWindowStart)}</dd></div>
        </dl>
      </div>
      <button type="button" onClick={onAccept}>Accept</button>
    </article>
  );
}

function ClaimTimeline({ donation }) {
  if (!donation) return <p>Select or accept a donation to track the receiving workflow.</p>;

  const statusOrder = ['accepted', 'pickup_scheduled', 'picked_up', 'delivered'];
  const activeIndex = Math.max(0, statusOrder.indexOf(donation.status));

  return (
    <div className="claim-timeline">
      {claimSteps.map(([status, label], index) => {
        const complete = donation.status === 'delivered' || index <= activeIndex || (index === 0 && donation.acceptedBy);
        return (
          <div className={complete ? 'complete' : ''} key={`${status}-${label}`}>
            <span>{complete ? <CheckCircle2 size={16} /> : <Clock size={16} />}</span>
            <strong>{label}</strong>
          </div>
        );
      })}
    </div>
  );
}
