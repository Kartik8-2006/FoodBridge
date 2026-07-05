import { useState } from 'react';
import { CheckCircle2, Clock, Navigation, PackageCheck, Star, Timer, Truck } from 'lucide-react';
import { api } from '../../api.js';
import TrackingMap from '../../components/TrackingMap.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatDate, titleCase } from '../../utils.js';
import { DashboardShell, NotificationList, StatGrid } from './DashboardParts.jsx';
import { useDashboardData } from './dashboardHooks.js';

const deliverySteps = [
  ['accepted', 'Accepted'],
  ['accepted', 'On Route'],
  ['picked_up', 'Picked Up'],
  ['delivered', 'Delivered'],
  ['delivered', 'Completed']
];

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const { data, error, refresh } = useDashboardData();
  const [selectedId, setSelectedId] = useState('');
  const [message, setMessage] = useState('');
  const [isSharingLocation, setIsSharingLocation] = useState(false);

  const tasks = data?.tasks || [];
  const assignedDeliveries = data?.assignedDeliveries || [];
  const history = data?.deliveryHistory || [];
  const availablePickups = tasks.filter((task) => task.status === 'posted');
  const selectedDelivery =
    assignedDeliveries.find((item) => item._id === selectedId) ||
    tasks.find((item) => item._id === selectedId) ||
    assignedDeliveries[0] ||
    availablePickups[0] ||
    tasks[0];
  const mapDestination = selectedDelivery?.pickupAddress
    ? `${selectedDelivery.pickupAddress}, ${selectedDelivery.city || ''}`.trim()
    : '';
  const directionsUrl = mapDestination ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapDestination)}` : '#';

  if (!data) return <main className="dashboard"><p>{error || 'Loading volunteer dashboard...'}</p></main>;

  async function accept(id) {
    setMessage('');
    try {
      await api(`/donations/${id}/accept`, { method: 'PATCH' });
      setSelectedId(id);
      setMessage('Pickup accepted. Navigate to the donor location and update progress.');
      await refresh();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function updateStatus(id, status) {
    setMessage('');
    try {
      await api(`/donations/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      setMessage(status === 'picked_up' ? 'Pickup confirmed. Head to the NGO destination.' : 'Delivery completed. Thank you for the impact.');
      await refresh();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function shareLocation() {
    if (!selectedDelivery) return;

    if (!selectedDelivery.assignedVolunteer && selectedDelivery.status === 'posted') {
      setMessage('Accept this pickup before sharing your tracking location.');
      return;
    }

    if (!navigator.geolocation) {
      setMessage('Location sharing is not available in this browser.');
      return;
    }

    setIsSharingLocation(true);
    setMessage('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await api(`/donations/${selectedDelivery._id}/tracking`, {
            method: 'PATCH',
            body: JSON.stringify({
              location: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                label: 'Volunteer live location'
              }
            })
          });
          setMessage('Location shared. Donor and NGO dashboards can now track the pickup.');
          await refresh();
        } catch (err) {
          setMessage(err.message);
        } finally {
          setIsSharingLocation(false);
        }
      },
      (geoError) => {
        setMessage(geoError.message || 'Unable to access your location.');
        setIsSharingLocation(false);
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 12000 }
    );
  }

  return (
    <DashboardShell eyebrow="Volunteer Dashboard" title="Pickup and delivery workspace">
      <section className="volunteer-hero" id="volunteer-home">
        <div>
          <p>Hello {user?.name || 'Volunteer'} 👋</p>
          <h2>Today&apos;s tasks</h2>
        </div>
        <a href="#available-pickups"><Navigation size={18} /> Start Route</a>
      </section>

      <section className="volunteer-summary-grid">
        <article><span>Today&apos;s Tasks</span><strong>{availablePickups.length}</strong><small>Available pickups</small></article>
        <article><span>Estimated Distance</span><strong>{data.stats.estimatedDistanceKm || 0} km</strong><small>Route estimate</small></article>
        <article><span>Completed</span><strong>{data.performance?.totalDeliveries || data.stats.completed}</strong><small>Deliveries</small></article>
      </section>

      <StatGrid stats={data.stats} />
      <section className="dashboard-overview-grid">
        <article className="overview-card overview-chart">
          <div className="overview-heading">
            <div><span>Route Load</span><h3>Pickup demand this week</h3></div>
            <strong>{availablePickups.length + assignedDeliveries.length}</strong>
          </div>
          <div className="overview-bars volunteer-bars">
            {[44, 66, 52, 78, 60, 84, 46].map((height, index) => <i key={index} style={{ '--height': `${height}%` }} />)}
          </div>
          <div className="overview-labels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
        </article>
        <article className="overview-card">
          <div className="overview-heading"><div><span>Field Status</span><h3>Today readiness</h3></div><Navigation /></div>
          <div className="readiness-list">
            <p><CheckCircle2 /> {availablePickups.length} nearby pickups available</p>
            <p><Truck /> {assignedDeliveries.length} deliveries assigned</p>
            <p><Timer /> {data.stats.estimatedDistanceKm || 0} km estimated route</p>
          </div>
        </article>
        <article className="overview-card">
          <div className="overview-heading"><div><span>Performance</span><h3>Reliability score</h3></div><Star /></div>
          <div className="donor-level">
            <strong>{data.performance?.rating || 'New'} rating</strong>
            <span><b style={{ width: data.performance?.rating ? '84%' : '28%' }} /></span>
            <small>{data.performance?.totalDeliveries || 0} completed deliveries logged</small>
          </div>
        </article>
      </section>
      {message && <div className="notice">{message}</div>}

      <section className="volunteer-dashboard-grid">
        <article className="volunteer-panel large" id="available-pickups">
          <div className="panel-heading">
            <div>
              <p className="dashboard-kicker">Nearby Pickups</p>
              <h2>Accept food pickup tasks</h2>
            </div>
            <span>{availablePickups.length} available</span>
          </div>
          <div className="pickup-card-list">
            {availablePickups.map((task, index) => (
              <PickupCard
                distance={task.distanceLabel || `${(index + 1) * 2} km`}
                key={task._id}
                onAccept={() => accept(task._id)}
                onSelect={() => setSelectedId(task._id)}
                selected={selectedDelivery?._id === task._id}
                task={task}
              />
            ))}
            {!availablePickups.length && <p>No nearby pickups right now.</p>}
          </div>
        </article>

        <article className="volunteer-panel" id="navigation">
          <div className="panel-heading">
            <div>
              <p className="dashboard-kicker">Navigation</p>
              <h2>{selectedDelivery?.title || 'Select a pickup'}</h2>
            </div>
          </div>
          <div className="volunteer-map-wrap">
            <TrackingMap donation={selectedDelivery} mode="volunteer" onShareLocation={shareLocation} isSharing={isSharingLocation} />
            {mapDestination && (
              <div className="volunteer-route-footer">
                <span>{selectedDelivery?.pickupAddress}</span>
                <a href={directionsUrl} target="_blank" rel="noreferrer">Open directions</a>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="volunteer-dashboard-grid">
        <article className="volunteer-panel large" id="assigned-deliveries">
          <div className="panel-heading">
            <div>
              <p className="dashboard-kicker">Assigned Deliveries</p>
              <h2>Accepted delivery tasks</h2>
            </div>
          </div>
          <div className="assigned-list">
            {assignedDeliveries.map((delivery) => (
              <button
                className={selectedDelivery?._id === delivery._id ? 'assigned-row selected' : 'assigned-row'}
                key={delivery._id}
                type="button"
                onClick={() => setSelectedId(delivery._id)}
              >
                <span><strong>{delivery.title}</strong><small>{delivery.pickupAddress}</small></span>
                <em>{titleCase(delivery.status)}</em>
              </button>
            ))}
            {!assignedDeliveries.length && <p>Accept a pickup to create an assigned delivery.</p>}
          </div>
        </article>

        <article className="volunteer-panel">
          <div className="panel-heading">
            <div>
              <p className="dashboard-kicker">Delivery Timeline</p>
              <h2>Progress</h2>
            </div>
          </div>
          <DeliveryTimeline delivery={selectedDelivery} />
          {selectedDelivery?.assignedVolunteer && (
            <div className="volunteer-actions">
              <button type="button" onClick={() => updateStatus(selectedDelivery._id, 'picked_up')} disabled={selectedDelivery.status === 'delivered'}>
                <Truck size={16} /> Picked Up
              </button>
              <button type="button" onClick={() => updateStatus(selectedDelivery._id, 'delivered')} disabled={selectedDelivery.status === 'delivered'}>
                <CheckCircle2 size={16} /> Complete
              </button>
            </div>
          )}
        </article>
      </section>

      <section className="volunteer-dashboard-grid">
        <article className="volunteer-panel" id="delivery-history">
          <div className="panel-heading">
            <div>
              <p className="dashboard-kicker">Delivery History</p>
              <h2>Completed deliveries</h2>
            </div>
          </div>
          <div className="history-list">
            {(history.length ? history : assignedDeliveries).map((delivery) => (
              <div key={delivery._id}>
                <strong>{delivery.title}</strong>
                <span>{titleCase(delivery.status)} · {delivery.estimatedMeals} meals</span>
                <button type="button" onClick={() => setSelectedId(delivery._id)}>View</button>
              </div>
            ))}
          </div>
        </article>

        <article className="volunteer-panel" id="performance">
          <div className="panel-heading">
            <div>
              <p className="dashboard-kicker">Performance</p>
              <h2>Impact</h2>
            </div>
          </div>
          <div className="performance-grid">
            <div><Truck /><span>Total Deliveries</span><strong>{data.performance?.totalDeliveries || 0}</strong></div>
            <div><Star /><span>Rating</span><strong>{data.performance?.rating || 'New'}</strong></div>
            <div><Timer /><span>Hours Worked</span><strong>{data.performance?.hoursWorked || 0}</strong></div>
            <div><PackageCheck /><span>Meals Delivered</span><strong>{data.performance?.impact || 0}</strong></div>
          </div>
        </article>
      </section>

      <section id="notifications"><NotificationList items={data.notifications} /></section>

      <section className="volunteer-dashboard-grid">
        <article className="volunteer-panel" id="profile">
          <div className="panel-heading"><div><p className="dashboard-kicker">Profile</p><h2>Volunteer details</h2></div></div>
          <div className="profile-detail-grid">
            <div><Navigation size={18} /><span>Base city</span><strong>{user?.profile?.city || 'City not set'}</strong></div>
            <div><Clock size={18} /><span>Availability</span><strong>{user?.profile?.availability || 'Availability not set'}</strong></div>
            <div><Truck size={18} /><span>Transport</span><strong>{user?.profile?.hasTransport ? 'Available' : 'Not added'}</strong></div>
            <div><Star size={18} /><span>Rating</span><strong>{data.performance?.rating || 'New'}</strong></div>
          </div>
        </article>
        <article className="volunteer-panel" id="settings">
          <div className="panel-heading"><div><p className="dashboard-kicker">Settings</p><h2>Route preferences</h2></div></div>
          <div className="settings-grid">
            <label><span>Auto share live location after pickup</span><input type="checkbox" defaultChecked /></label>
            <label><span>Urgent pickup alerts</span><input type="checkbox" defaultChecked /></label>
            <label><span>Weekend availability</span><input type="checkbox" /></label>
            <label><span>Show long distance tasks</span><input type="checkbox" /></label>
          </div>
        </article>
      </section>
    </DashboardShell>
  );
}

function PickupCard({ task, distance, selected, onSelect, onAccept }) {
  return (
    <article className={selected ? 'pickup-card selected' : 'pickup-card'}>
      <button className="pickup-select" type="button" onClick={onSelect}>
        {task.imageUrl ? <img src={task.imageUrl} alt="" /> : <div className="pickup-placeholder"><Truck /></div>}
        <span>
          <strong>{task.donor?.profile?.organizationName || task.donor?.name || 'Restaurant'}</strong>
          <small>{task.title}</small>
          <small>{distance} · {formatDate(task.pickupWindowStart)}</small>
        </span>
      </button>
      <div className="pickup-meta">
        <span>{task.quantity}</span>
        <span>{titleCase(task.foodType)}</span>
      </div>
      {task.status === 'posted'
        ? <button className="accept-pickup" type="button" onClick={onAccept}>Accept</button>
        : <span className="accepted-chip">{titleCase(task.status)}</span>}
    </article>
  );
}

function DeliveryTimeline({ delivery }) {
  if (!delivery) return <p>Select a pickup to see delivery progress.</p>;
  const statusOrder = ['accepted', 'picked_up', 'delivered'];
  const activeIndex = Math.max(0, statusOrder.indexOf(delivery.status));

  return (
    <div className="volunteer-timeline">
      {deliverySteps.map(([status, label], index) => {
        const complete = index <= activeIndex;
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
