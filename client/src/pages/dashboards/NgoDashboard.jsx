import { useMemo, useState } from 'react';
import { CheckCircle2, Clock, Home, MapPin, PackageCheck, School, Soup, Truck, UsersRound } from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
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
  const { t } = useLanguage();
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
      ['Average Delivery Time', reports.averageDeliveryTime || t('Pending')],
      ['Monthly Analytics', reports.monthlyAnalytics || 0]
    ];
  }, [data, t]);

  if (!data) return <main className="dashboard"><p>{t(error) || t('Loading NGO dashboard...')}</p></main>;

  async function accept(id) {
    setMessage('');
    try {
      await api(`/donations/${id}/accept`, { method: 'PATCH' });
      setSelectedDonationId(id);
      setMessage(t('Donation claimed. Assign a volunteer and track pickup progress.'));
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
      setMessage(t('Volunteer pickup confirmed. Track delivery until received.'));
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
      setMessage(t('Food received and marked delivered. Beneficiary report updated.'));
      refresh();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <DashboardShell eyebrow="NGO Dashboard" title="Food receiving and distribution center">
      <section className="ngo-hero" id="ngo-home">
        <div>
          <p>{t("Hello")}, {user?.name || t('NGO')} 👋</p>
          <h2>{t("Nearby donations available")}</h2>
        </div>
        <a href="#available-donations">{t("Claim Now")}</a>
      </section>

      <section className="ngo-summary-grid">
        <article><span>{t("Nearby Donations Available")}</span><strong>{availableDonations.length}</strong><small>{t("Active donations")}</small></article>
        <article><span>{t("Food Requests Pending")}</span><strong>{data.stats.openRequests}</strong><small>{t("Requests from recipients")}</small></article>
        <article><span>{t("Today's Distribution")}</span><strong>{data.stats.todaysDistribution || 0}</strong><small>{t("Meals")}</small></article>
      </section>

      <StatGrid stats={data.stats} />

      {message && <div className="notice">{t(message)}</div>}

      <section className="ngo-dashboard-grid">
        <article className="ngo-panel large" id="available-donations">
          <div className="panel-heading">
            <div>
              <p className="dashboard-kicker">{t("Available Donations")}</p>
              <h2>{t("Claim nearby food donations")}</h2>
            </div>
            <span>{availableDonations.length} {t("available")}</span>
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
            {!availableDonations.length && <p>{t("No available donations right now.")}</p>}
          </div>
        </article>

        <article className="ngo-panel" id="claim-workflow">
          <div className="panel-heading">
            <div>
              <p className="dashboard-kicker">{t("Claim Donation")}</p>
              <h2>{selectedDonation?.title || t('Select a donation')}</h2>
            </div>
          </div>
          <ClaimTimeline donation={selectedDonation} />
          {selectedDonation && selectedDonation.acceptedBy && (
            <div className="claim-actions">
              <button type="button" onClick={() => markPickedUp(selectedDonation._id)} disabled={selectedDonation.status === 'delivered'}>
                <Truck size={16} /> {t("Track Volunteer")}
              </button>
              <button type="button" onClick={() => markDelivered(selectedDonation._id)} disabled={selectedDonation.status === 'delivered'}>
                <CheckCircle2 size={16} /> {t("Mark Delivered")}
              </button>
            </div>
          )}
        </article>
      </section>

      <section className="ngo-dashboard-grid">
        <article className="ngo-panel large" id="claimed-donations">
          <div className="panel-heading">
            <div>
              <p className="dashboard-kicker">{t("Claimed Donations")}</p>
              <h2>{t("Accepted and in-progress donations")}</h2>
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
                <span><strong>{donation.title}</strong><small>{donation.donor?.name || t('Registered food donor')} · {donation.quantity}</small></span>
                <em>{t(titleCase(donation.status))}</em>
              </button>
            ))}
            {!claimedDonations.length && <p>{t("No claimed donations yet. Accept one from Available Donations.")}</p>}
          </div>
        </article>

        <article className="ngo-panel" id="volunteers">
          <div className="panel-heading">
            <div>
              <p className="dashboard-kicker">{t("Volunteers")}</p>
              <h2>{t("Pickup coordination")}</h2>
            </div>
          </div>
          <div className="volunteer-track-card">
            <Truck />
            <strong>{selectedDonation?.assignedVolunteer?.name || t('Volunteer assignment pending')}</strong>
            <span>{selectedDonation?.status ? t(titleCase(selectedDonation.status)) : t('Waiting for claimed donation')}</span>
          </div>
        </article>
      </section>

      <section className="ngo-dashboard-grid">
        <article className="ngo-panel large" id="beneficiaries">
          <div className="panel-heading">
            <div>
              <p className="dashboard-kicker">{t("Beneficiaries")}</p>
              <h2>{t("Track where food went")}</h2>
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
                <span>{t(label)}</span>
              </button>
            ))}
          </div>
          <label className="beneficiary-input">
            {t("Beneficiaries served")}
            <input type="number" min="0" value={beneficiaryCount} onChange={(event) => setBeneficiaryCount(event.target.value)} />
          </label>
        </article>

        <article className="ngo-panel" id="food-requests">
          <div className="panel-heading">
            <div>
              <p className="dashboard-kicker">{t("Food Requests")}</p>
              <h2>{t("Pending needs")}</h2>
            </div>
          </div>
          <div className="food-request-list">
            {(data.foodRequests || []).map((request) => (
              <div key={request._id}>
                <strong>{request.need}</strong>
                <span>{request.location} · {request.householdSize} {t('people')} · {t(titleCase(request.urgency))}</span>
              </div>
            ))}
            {!data.foodRequests?.length && <p>{t("No pending food requests.")}</p>}
          </div>
        </article>
      </section>

      <section className="ngo-panel" id="reports">
        <div className="panel-heading">
          <div>
            <p className="dashboard-kicker">{t("Reports")}</p>
            <h2>{t("Distribution analytics")}</h2>
          </div>
        </div>
        <div className="ngo-report-grid">
          {reportCards.map(([label, value]) => (
            <article key={label}><span>{t(label)}</span><strong>{value}</strong></article>
          ))}
        </div>
      </section>

      <section className="ngo-panel ngo-map-panel">
        <div>
          <p className="dashboard-kicker">{t("Google Maps Integration")}</p>
          <h2>{t("Pickup location map")}</h2>
        </div>
        <div className="ngo-map">
          {selectedDonation?.pickupAddress ? (
            <iframe
              title="Donation pickup map"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(`${selectedDonation.pickupAddress} ${selectedDonation.city}`)}&output=embed`}
            />
          ) : (
            <><MapPin /><span>{t("Select a donation to preview pickup location.")}</span></>
          )}
        </div>
      </section>

      <section id="notifications"><NotificationList items={data.notifications} /></section>

      <section className="ngo-panel" id="profile">
        <h2>{t("Profile")}</h2>
        <p>{user?.name} · {user?.profile?.serviceArea || user?.profile?.city || t('Service area not set')}</p>
      </section>
    </DashboardShell>
  );
}

function DonationClaimCard({ donation, distance, onAccept }) {
  const { t } = useLanguage();
  return (
    <article className="ngo-donation-card">
      {donation.imageUrl ? <img src={donation.imageUrl} alt="" /> : <div className="ngo-food-placeholder"><PackageCheck /></div>}
      <div>
        <span className="food-type">{t(titleCase(donation.foodType))} · {t(titleCase(donation.dietType))}</span>
        <h3>{donation.title}</h3>
        <p>{donation.donor?.profile?.organizationName || donation.donor?.name || t('Registered food donor')}</p>
        <dl>
          <div><dt>{t("Distance")}</dt><dd>{distance}</dd></div>
          <div><dt>{t("Quantity")}</dt><dd>{donation.quantity}</dd></div>
          <div><dt>{t("Pickup Time")}</dt><dd>{formatDate(donation.pickupWindowStart)}</dd></div>
        </dl>
      </div>
      <button type="button" onClick={onAccept}>{t("Accept")}</button>
    </article>
  );
}

function ClaimTimeline({ donation }) {
  const { t } = useLanguage();
  if (!donation) return <p>{t("Select or accept a donation to track the receiving workflow.")}</p>;

  const statusOrder = ['accepted', 'pickup_scheduled', 'picked_up', 'delivered'];
  const activeIndex = Math.max(0, statusOrder.indexOf(donation.status));

  return (
    <div className="claim-timeline">
      {claimSteps.map(([status, label], index) => {
        const complete = donation.status === 'delivered' || index <= activeIndex || (index === 0 && donation.acceptedBy);
        return (
          <div className={complete ? 'complete' : ''} key={`${status}-${label}`}>
            <span>{complete ? <CheckCircle2 size={16} /> : <Clock size={16} />}</span>
            <strong>{t(label)}</strong>
          </div>
        );
      })}
    </div>
  );
}
