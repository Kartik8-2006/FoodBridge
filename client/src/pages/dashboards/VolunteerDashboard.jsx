import { useMemo, useState } from 'react';
import { AlertCircle, Award, CheckCircle2, ChevronDown, Clock, Lightbulb, MapPin, Maximize2, Navigation, Package, PackageCheck, RefreshCw, ShieldCheck, Star, Store, Timer, Truck, Users, Utensils, X } from 'lucide-react';
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
  const [taskFilter, setTaskFilter] = useState('All Tasks');
  const [sortBy, setSortBy] = useState('Closest First');
  const [activeChips, setActiveChips] = useState(['Distance: <2km', 'Urgency: High']);

  const tasks = data?.tasks || [];
  const assignedDeliveries = data?.assignedDeliveries || [];
  const history = data?.deliveryHistory || [];
  const availablePickups = tasks.filter((task) => task.status === 'posted');

  const displayTasks = useMemo(() => {
    const items = availablePickups.map((task, index) => ({
      _id: task._id,
      type: 'pickup',
      title: task.title,
      isNew: index === 0,
      isUrgent: task.estimatedMeals > 30,
      distance: task.distanceLabel || `~ ${(index + 1) * 0.6 + 0.2} km away`,
      pickupLocation: task.donor?.profile?.organizationName || task.donor?.name || 'Local Donor',
      pickupAddress: task.pickupAddress || 'Address not specified',
      dropoffLocation: task.acceptedBy?.name || 'City Community Kitchen',
      dropoffAddress: task.deliveryAddress || '456 Hope Blvd, East Side',
      description: task.storageInstructions || 'Safe, fresh surplus food ready for immediate distribution.',
      duration: '25 mins est.',
      loadSize: task.estimatedMeals > 20 ? 'Medium Load' : 'Small Load',
      quantity: task.quantity,
      estimatedMeals: task.estimatedMeals,
      foodType: task.foodType,
      dietType: task.dietType,
      dietaryLabels: task.dietaryLabels || [],
      allergenNotes: task.allergenNotes || ''
    }));

    const mockTasks = [
      {
        _id: 'mock-sorting-1',
        type: 'sorting',
        title: 'Central Sorting Hub Help',
        isNew: true,
        isUrgent: false,
        distance: '~ 0.8 km away',
        pickupLocation: 'Central Logistics Depot',
        pickupAddress: 'Central Logistics Depot, Bay 4',
        description: 'Assist in organizing dry goods for morning deliveries.',
        duration: '2 hours',
        loadSize: 'Indoor Task',
        quantity: '50+ Crates',
        foodType: 'mixed',
        dietType: 'mixed',
        dietaryLabels: ['Dry Goods', 'Canned'],
        allergenNotes: ''
      },
      {
        _id: 'mock-pickup-2',
        type: 'pickup',
        title: 'Artisan Bakery Surplus',
        isNew: false,
        isUrgent: true,
        distance: '~ 1.2 km away',
        pickupLocation: 'Artisan Bakery',
        pickupAddress: '124 Main Street, Downtown',
        dropoffLocation: 'City Community Kitchen',
        dropoffAddress: '456 Hope Blvd, East Side',
        description: 'Baguettes, sourdough loaves, and miscellaneous sweet pastries.',
        duration: '25 mins est.',
        loadSize: 'Small Load',
        quantity: '15 KG',
        estimatedMeals: 35,
        foodType: 'bakery',
        dietType: 'vegan',
        dietaryLabels: ['Vegetarian', 'Vegan', 'Dairy Free'],
        allergenNotes: 'Contains Wheat/Gluten'
      }
    ];

    const merged = [...mockTasks, ...items];

    let filtered = merged;
    if (taskFilter === 'Pickup') {
      filtered = filtered.filter(t => t.type === 'pickup');
    } else if (taskFilter === 'Sorting') {
      filtered = filtered.filter(t => t.type === 'sorting');
    } else if (taskFilter === 'Delivery') {
      filtered = filtered.filter(t => t.type === 'delivery');
    }

    if (activeChips.includes('Distance: <2km')) {
      filtered = filtered.filter(t => {
        const num = parseFloat(String(t.distance || '').replace(/[^\d.]/g, ''));
        return isNaN(num) || num <= 2.0;
      });
    }
    if (activeChips.includes('Urgency: High')) {
      filtered = filtered.filter(t => t.isUrgent || t.type === 'sorting');
    }

    if (sortBy === 'Closest First') {
      filtered.sort((a, b) => {
        const distA = parseFloat(String(a.distance || '').replace(/[^\d.]/g, '')) || 0;
        const distB = parseFloat(String(b.distance || '').replace(/[^\d.]/g, '')) || 0;
        return distA - distB;
      });
    }

    return filtered;
  }, [availablePickups, taskFilter, sortBy, activeChips]);

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
  const deliveryCount = data?.performance?.totalDeliveries || data?.stats?.completed || 128;
  const pointsEarned = data?.performance?.points || 2450;
  const hoursWorked = data?.performance?.hoursWorked || 48.5;
  const impactCount = data?.performance?.impact || 1420;
  const nextPickup = selectedDelivery || availablePickups[0];
  const pickupMapQuery = nextPickup?.pickupLocation?.latitude && nextPickup?.pickupLocation?.longitude
    ? `${nextPickup.pickupLocation.latitude},${nextPickup.pickupLocation.longitude}`
    : nextPickup?.pickupAddress
      ? `${nextPickup.pickupAddress}, ${nextPickup.city || ''}`.trim()
      : 'Whole Foods Market, New York';
  const pickupMapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(pickupMapQuery)}&z=13&output=embed`;
  const urgentTasks = availablePickups.slice(0, 2);
  const dashboardTasks = urgentTasks.length
    ? urgentTasks
    : [
      { _id: 'sample-bakery', title: 'Artisan Bakery Surplus', distanceLabel: '1.2 miles away', expires: 'Expires in 30m', foodType: 'bakery' },
      { _id: 'sample-sorting', title: 'Central Sorting Hub Help', distanceLabel: '0.8 miles away', expires: 'Expires in 1h', foodType: 'produce' }
    ];

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
      <section className="volunteer-overview-reference" id="volunteer-home">
        <div className="volunteer-overview-head">
          <div>
            <h2>Good Morning, {user?.name || 'Sarah'}</h2>
            <p>You&apos;ve saved 45 lbs of food this week. Keep it up!</p>
          </div>
          <span><ShieldCheck size={29} /> Active Volunteer Status</span>
        </div>

        <div className="volunteer-overview-stats">
          <article>
            <span><Truck size={43} /></span>
            <div><small>Total Deliveries</small><strong>{deliveryCount}</strong></div>
          </article>
          <article>
            <span><Award size={43} /></span>
            <div><small>Points Earned</small><strong>{Number(pointsEarned).toLocaleString()} XP</strong></div>
          </article>
          <article>
            <span><Clock size={43} /></span>
            <div><small>Hours Contributed</small><strong>{hoursWorked} hrs</strong></div>
          </article>
        </div>

        <div className="volunteer-overview-grid">
          <div className="volunteer-main-column">
            <article className="volunteer-pickup-card">
              <header>
                <h3><CalendarMiniIcon /> Next Scheduled Pickup</h3>
                <span>Starts in 1h 24m</span>
              </header>
              <div className="volunteer-pickup-body">
                <div className="volunteer-route-details">
                  <RoutePoint icon={<Store size={28} />} label="Pickup" title={nextPickup?.donor?.profile?.organizationName || nextPickup?.donor?.name || 'Whole Foods Market'} text={nextPickup?.pickupAddress || '123 Market St, Central Heights'} />
                  <RoutePoint icon={<MapPin size={31} />} label="Drop-Off" title={nextPickup?.acceptedBy?.name || 'St. Jude Community Kitchen'} text={nextPickup?.deliveryAddress || '456 Hope Blvd, East Side'} />
                  <div className="volunteer-estimate-row">
                    <span><Package size={24} /></span>
                    <p>Estimated: <strong>~35 lbs (Bakery, Produce)</strong></p>
                  </div>
                  <button type="button" onClick={() => nextPickup?._id && setSelectedId(nextPickup._id)}>Open Pickup Details</button>
                </div>
                <div className="volunteer-map-image">
                  <iframe
                    title={`Pickup map for ${nextPickup?.title || 'scheduled pickup'}`}
                    src={pickupMapSrc}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </article>

            <section className="volunteer-urgent-section">
              <div className="volunteer-section-heading">
                <h3><AlertCircle size={28} /> Urgent Tasks Near You</h3>
                <a href="#available-pickups">View All</a>
              </div>
              <div className="volunteer-task-list">
                {dashboardTasks.map((task, index) => (
                  <article key={task._id}>
                    <span className={index === 0 ? 'warm' : 'green'}>{index === 0 ? <Store size={27} /> : <Utensils size={30} />}</span>
                    <div>
                      <strong>{task.title}</strong>
                      <small>{task.distanceLabel || `${(index + 1) * 1.2} miles away`} &middot; {task.expires || 'Expires in 1h'}</small>
                    </div>
                    <button type="button" onClick={() => !String(task._id).startsWith('sample-') && accept(task._id)}>Claim</button>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="volunteer-side-column">
            <article className="volunteer-goal-card">
              <h3><Award size={31} /> Monthly Goal</h3>
              <div><span>Community Hero II</span><strong>75% Complete</strong></div>
              <i><b /></i>
              <p>Rescue <strong>500 lbs</strong> of food to earn the Hero badge. 125 lbs remaining.</p>
            </article>

            <article className="volunteer-impact-card">
              <h3>Impact Tracker</h3>
              <strong>{Number(impactCount).toLocaleString()}</strong>
              <p>People fed this year through your personal rescue efforts.</p>
              <div><span>Top 5%</span><span>Active 30d Streak</span></div>
            </article>

            <article className="volunteer-tips-card">
              <h3><Lightbulb size={31} /> Volunteer Pro Tips</h3>
              <p><CheckCircle2 size={26} /> Always check donor notes for specific loading bay instructions or security buzzers.</p>
              <p><CheckCircle2 size={26} /> Taking clean photos of donations helps our partner kitchens prepare storage space.</p>
            </article>
          </aside>
        </div>
      </section>
      {message && <div className="notice">{message}</div>}

      {/* ── Available Tasks Redesigned Section ── */}
      <section className="vt-workspace-page" id="available-pickups" data-dashboard-section="available-pickups">
        <div className="vt-header-row">
          <div className="vt-title-area">
            <h2>Available Tasks</h2>
            <p>Help reduce food waste in your local area today.</p>
          </div>
          <div className="vt-sort-area">
            <span>SORT BY:</span>
            <div className="vt-sort-select-wrapper">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="vt-sort-select"
              >
                <option value="Closest First">Closest First</option>
                <option value="Urgent First">Urgent First</option>
              </select>
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        <div className="vt-filters-row">
          <div className="vt-pill-group">
            {['All Tasks', 'Pickup', 'Delivery', 'Sorting'].map((filter) => (
              <button
                key={filter}
                type="button"
                className={`vt-pill-btn ${taskFilter === filter ? 'active' : ''}`}
                onClick={() => setTaskFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          <span className="vt-filter-divider">|</span>

          <div className="vt-chips-group">
            {activeChips.map((chip) => (
              <span key={chip} className="vt-chip-tag">
                {chip}
                <button
                  type="button"
                  onClick={() => setActiveChips(activeChips.filter(c => c !== chip))}
                  aria-label={`Remove filter ${chip}`}
                >
                  <X size={13} />
                </button>
              </span>
            ))}
            {activeChips.length < 2 && (
              <button
                type="button"
                className="vt-add-filters-btn"
                onClick={() => setActiveChips(['Distance: <2km', 'Urgency: High'])}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        <div className="vt-workspace-grid">
          {/* Left Column: Tasks & Filters */}
          <div className="vt-tasks-column">
            <div className="vt-cards-list">
              {displayTasks.map((task) => (
                <AvailableTaskCard
                  key={task._id}
                  task={task}
                  onClaim={async () => {
                    if (String(task._id || '').startsWith('mock-')) {
                      setMessage(`Successfully claimed task: ${task.title} (Simulated)`);
                    } else {
                      await accept(task._id);
                    }
                  }}
                />
              ))}
              {displayTasks.length === 0 && (
                <div className="vt-empty-state">
                  <p>No tasks match the active filters.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Map Preview */}
          <div className="vt-map-sidebar">
            <div className="vt-map-header">
              <h3>Map Preview</h3>
              <button type="button" aria-label="Maximize Map">
                <Maximize2 size={18} />
              </button>
            </div>

            <div className="vt-map-container">
              <iframe
                title="Available Pickups Map Preview"
                src="https://maps.google.com/maps?q=Central%20Logistics%20Depot,%20Bengaluru&z=13&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="vt-map-footer-box">
              <div className="vt-nearby-header">
                <h4>Nearby Center</h4>
                <p>Showing {displayTasks.length} tasks within a 5km radius of your current location.</p>
              </div>
              <div className="vt-map-actions">
                <button
                  type="button"
                  className="vt-btn-refresh"
                  onClick={async () => {
                    await refresh();
                    setMessage('Available tasks updated.');
                  }}
                >
                  Refresh Results
                </button>
                <button
                  type="button"
                  className="vt-btn-sync"
                  aria-label="Sync Location"
                  onClick={async () => {
                    await refresh();
                    setMessage('Location synchronized.');
                  }}
                >
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Navigation Section ── */}
      <section className="volunteer-dashboard-grid" id="navigation" data-dashboard-section="navigation">
        <article className="volunteer-panel" style={{ width: '100%', gridColumn: 'span 2' }}>
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

function CalendarMiniIcon() {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 3v4M16 3v4M4 10h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function RoutePoint({ icon, label, title, text }) {
  return (
    <div className="volunteer-route-point">
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </div>
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


function AvailableTaskCard({ task, onClaim }) {
  return (
    <article className="vt-task-card">
      <div className="vt-card-top-row">
        <div className="vt-card-badges">
          {task.isUrgent && <span className="vt-badge urgent">URGENT</span>}
          {task.isNew && <span className="vt-badge new">NEW</span>}
          <span className={`vt-badge ${task.type}`}>{task.type.toUpperCase()}</span>
        </div>
        <span className="vt-card-distance">{task.distance}</span>
      </div>

      <h3 className="vt-card-title">{task.title}</h3>

      <div className="vt-route-details">
        {task.type === 'sorting' ? (
          <div className="vt-route-point single">
            <span className="vt-bullet brown" />
            <div>
              <small>LOCATION</small>
              <strong>{task.pickupLocation}</strong>
              <p>{task.pickupAddress}</p>
            </div>
          </div>
        ) : (
          <div className="vt-route-timeline">
            <div className="vt-route-point">
              <span className="vt-bullet brown" />
              <div>
                <small>PICKUP</small>
                <strong>{task.pickupLocation}</strong>
                <p>{task.pickupAddress}</p>
              </div>
            </div>
            <div className="vt-timeline-line" />
            <div className="vt-route-point">
              <span className="vt-bullet dark" />
              <div>
                <small>DROP-OFF</small>
                <strong>{task.dropoffLocation}</strong>
                <p>{task.dropoffAddress}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Food Details Row */}
      <div className="vt-food-details">
        <div className="vt-food-meta-grid">
          {task.quantity && (
            <div className="vt-food-meta-col">
              <span className="vt-food-label">QUANTITY</span>
              <span className="vt-food-value">{task.quantity}</span>
            </div>
          )}
          {task.estimatedMeals && (
            <div className="vt-food-meta-col">
              <span className="vt-food-label">EST. MEALS</span>
              <span className="vt-food-value">{task.estimatedMeals} meals</span>
            </div>
          )}
          {(task.foodType || task.dietType) && (
            <div className="vt-food-meta-col">
              <span className="vt-food-label">FOOD TYPE</span>
              <span className="vt-food-value">{titleCase(task.foodType || '')} ({titleCase(task.dietType || '')})</span>
            </div>
          )}
        </div>

        {task.dietaryLabels && task.dietaryLabels.length > 0 && (
          <div className="vt-dietary-pills">
            {task.dietaryLabels.map(lbl => (
              <span key={lbl} className="vt-dietary-pill">{lbl}</span>
            ))}
          </div>
        )}

        {task.allergenNotes && (
          <div className="vt-allergen-alert">
            <AlertCircle size={13} />
            <span>{task.allergenNotes}</span>
          </div>
        )}
      </div>

      {task.description && (
        <div className="vt-quote-box">
          <p>&ldquo;{task.description}&rdquo;</p>
        </div>
      )}

      <div className="vt-card-footer">
        <div className="vt-footer-meta">
          <span className="vt-meta-item">
            <Clock size={16} />
            {task.duration}
          </span>
          <span className="vt-meta-item">
            {task.type === 'sorting' ? <Users size={16} /> : <Package size={16} />}
            {task.loadSize}
          </span>
        </div>
        <button type="button" className="vt-claim-btn" onClick={onClaim}>
          Claim Task
        </button>
      </div>
    </article>
  );
}
