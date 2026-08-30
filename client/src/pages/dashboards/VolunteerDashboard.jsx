import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Award, Bell, CheckCircle2, ChevronDown, ChevronUp, Clock, Edit2, Eye, EyeOff, Globe, HelpCircle, Info, Languages, Leaf, Lightbulb, Lock, Mail, MapPin, Maximize2, MessageSquare, MoreVertical, Navigation, Package, PackageCheck, Phone, RefreshCw, Save, Send, Shield, ShieldCheck, ShoppingBag, Soup, Star, Store, Timer, Truck, User, Users, Utensils, X, Download, Filter, Calendar, Coffee } from 'lucide-react';
import { api } from '../../api.js';
import TrackingMap from '../../components/TrackingMap.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
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
  const { language, setLanguage, t } = useLanguage();
  const { data, error, refresh } = useDashboardData();
  const [selectedId, setSelectedId] = useState('');
  const [message, setMessage] = useState('');
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [taskFilter, setTaskFilter] = useState('All Tasks');
  const [sortBy, setSortBy] = useState('Closest First');
  const [activeChips, setActiveChips] = useState(['Distance: <2km', 'Urgency: High']);

  // ── Profile & Settings State ──
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.profile?.phone || '',
    vehicleType: user?.profile?.vehicleType || 'Bike',
    address: user?.profile?.address || ''
  });
  const [profileNotice, setProfileNotice] = useState('');

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [sysAnnouncements, setSysAnnouncements] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [securityNotice, setSecurityNotice] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [settingsNotice, setSettingsNotice] = useState('');

  const updateProfileField = (e) => {
    const { name, value } = e.target;
    setProfileForm(current => ({ ...current, [name]: value }));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileNotice('');
    try {
      const res = await api('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: profileForm.name,
          profile: {
            phone: profileForm.phone,
            vehicleType: profileForm.vehicleType,
            address: profileForm.address
          }
        })
      });
      setProfileNotice(t(res.message || 'Profile settings saved successfully!'));
      setTimeout(() => setProfileNotice(''), 3000);
    } catch (err) {
      setProfileNotice(t(err.message || 'Unable to update profile.'));
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSecurityNotice('');
    setSecurityError('');
    if (newPassword !== confirmNewPassword) {
      setSecurityError(t('Confirm password does not match new password'));
      return;
    }
    try {
      const res = await api('/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      setSecurityNotice(t(res.message || 'Password changed successfully'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setSecurityError(t(err.message || 'Failed to change password'));
    }
  };

  const handleSettingsSave = (e) => {
    if (e) e.preventDefault();
    setSettingsNotice(t('Platform preferences saved successfully!'));
    setTimeout(() => setSettingsNotice(''), 3000);
  };

  const tasks = data?.tasks || [];
  const assignedDeliveries = data?.assignedDeliveries || [];
  const history = data?.deliveryHistory || [];
  const availablePickups = tasks;

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

    let filtered = items;
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
  const deliveryCount = data?.performance?.totalDeliveries ?? data?.stats?.completed ?? 0;
  const pointsEarned = data?.performance?.points ?? 0;
  const hoursWorked = data?.performance?.hoursWorked ?? 0;
  const impactCount = data?.performance?.impact ?? 0;
  const weeklyKg = data?.performance?.weeklySaved ?? 0;
  const nextPickup = assignedDeliveries.find(d => d.status !== 'delivered') || assignedDeliveries[0] || null;
  const pickupMapQuery = nextPickup?.pickupLocation?.latitude && nextPickup?.pickupLocation?.longitude
    ? `${nextPickup.pickupLocation.latitude},${nextPickup.pickupLocation.longitude}`
    : nextPickup?.pickupAddress
      ? `${nextPickup.pickupAddress}, ${nextPickup.city || ''}`.trim()
      : 'Whole Foods Market, New York';
  const pickupMapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(pickupMapQuery)}&z=13&output=embed`;
  const urgentTasks = availablePickups.slice(0, 2);
  const dashboardTasks = urgentTasks;

  // Redesigned Active Pickup bindings
  const activePickup = assignedDeliveries.find((delivery) => delivery.status !== 'delivered') || assignedDeliveries[0] || null;

  const activePickupStatus = activePickup?.status || '';
  const isAwaitingAcceptance = activePickup && !activePickup.volunteerAccepted;
  const activePickupStatusLabel = activePickupStatus === 'delivered' ? 'DELIVERED' : isAwaitingAcceptance ? 'AWAITING ACCEPTANCE' : activePickupStatus === 'pickup_scheduled' ? 'ASSIGNED' : 'IN TRANSIT';
  const activePickupProgress = activePickupStatus === 'delivered' ? '100%' : isAwaitingAcceptance ? '33%' : activePickupStatus === 'pickup_scheduled' ? '50%' : '75%';
  const activePickupId = activePickup?._id ? `FR-2026-${String(activePickup._id).slice(-3).toUpperCase()}` : '';
  const activePickupMapQuery = activePickup?.volunteerLocation?.latitude && activePickup?.volunteerLocation?.longitude
    ? `${activePickup.volunteerLocation.latitude},${activePickup.volunteerLocation.longitude}`
    : activePickup?.pickupLocation?.latitude && activePickup?.pickupLocation?.longitude
      ? `${activePickup.pickupLocation.latitude},${activePickup.pickupLocation.longitude}`
      : activePickup?.pickupAddress
        ? `${activePickup.pickupAddress}, ${activePickup.city || ''}`.trim()
        : '';
  const activePickupMapSrc = activePickupMapQuery ? `https://maps.google.com/maps?q=${encodeURIComponent(activePickupMapQuery)}&z=13&output=embed` : '';
  const activePickupDirectionsUrl = activePickupMapQuery ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activePickupMapQuery)}` : '#';
  const activeDonorName = activePickup?.donorName || activePickup?.donor?.name || activePickup?.donor?.profile?.organizationName || '';
  const activeDonorRole = activePickup?.donor?.profile?.role || activePickup?.donorRole || '';
  const activeDonorPhone = activePickup?.contactNumber || activePickup?.donor?.phone || activePickup?.donor?.profile?.phone || '';
  const activeRecipientName = activePickup?.dropoffLocation || activePickup?.acceptedBy?.name || activePickup?.recipientName || '';
  const activeDropoffAddress = activePickup?.dropoffAddress || activePickup?.deliveryAddress || '';
  const activeInstructions = activePickup?.storageInstructions || activePickup?.description || activePickup?.specialInstructions || '';
  const activeEtaLabel = activePickup?.etaLabel || activePickup?.estimatedArrival || activePickup?.estimatedArrivalLabel || '';
  const activeDeliveryWindow = activePickup?.deliveryWindowLabel || activePickup?.deliveryWindow || activePickup?.pickupWindowEnd || '';
  const activeDeliveryWindowLabel = activePickup?.deliveryWindowLabel ? activePickup.deliveryWindowLabel : activeDeliveryWindow ? formatDate(activeDeliveryWindow) : '';
  const nextAssignedPickup = assignedDeliveries.find((delivery) => delivery._id !== activePickup?._id && delivery.status !== 'delivered') || null;

  // ── Chat / Messenger State ──
  const [chatContacts, setChatContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');

  async function fetchContacts() {
    try {
      const res = await api('/messages/contacts');
      setChatContacts(res.contacts || []);
      if (res.contacts?.length && !selectedContact) setSelectedContact(res.contacts[0]);
    } catch (err) { console.error('Failed to load chat contacts', err); }
  }
  async function fetchChatMessages(contactId) {
    if (!contactId) return;
    try {
      const res = await api(`/messages/thread/${contactId}`);
      setChatMessages(res.messages || []);
    } catch (err) { console.error('Failed to load messages', err); }
  }
  async function handleSendMessage(e) {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedContact) return;
    const text = newMessageText;
    setNewMessageText('');
    try {
      await api('/messages', { method: 'POST', body: JSON.stringify({ recipientId: selectedContact._id, text }) });
      fetchChatMessages(selectedContact._id);
    } catch (err) { console.error('Failed to send message', err); }
  }
  useEffect(() => {
    fetchContacts();
    const iv = setInterval(fetchContacts, 6000);
    return () => clearInterval(iv);
  }, []);
  useEffect(() => {
    if (selectedContact?._id) {
      fetchChatMessages(selectedContact._id);
      const iv = setInterval(() => fetchChatMessages(selectedContact._id), 3000);
      return () => clearInterval(iv);
    }
  }, [selectedContact?._id]);

  if (!data) return <main className="dashboard"><p>{error || 'Loading volunteer dashboard...'}</p></main>;

  async function accept(id) {
    setMessage('');
    try {
      await api(`/donations/${id}/volunteer-claim`, { method: 'PATCH' });
      setSelectedId(id);
      setMessage('Pickup claimed successfully. Drive to the pickup location and coordinate delivery.');
      await refresh();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function acceptAssignment(id) {
    setMessage('');
    try {
      await api(`/donations/${id}/volunteer-accept`, { method: 'PATCH' });
      setSelectedId(id);
      setMessage('Assignment accepted. Pickup details unlocked.');
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
            <h2>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0] || 'Volunteer'}</h2>
            <p>{weeklyKg > 0 ? `You've rescued ${weeklyKg} kg of food this week. Keep it up!` : 'Welcome back! Check available tasks and start making an impact.'}</p>
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
                <span>{nextPickup ? `Pickup: ${formatDate(nextPickup.pickupWindowStart || nextPickup.createdAt)}` : 'No upcoming pickups'}</span>
              </header>
              {nextPickup ? (
                <div className="volunteer-pickup-body">
                  <div className="volunteer-route-details">
                    <RoutePoint icon={<Store size={28} />} label="Pickup" title={nextPickup?.donor?.profile?.organizationName || nextPickup?.donor?.name || 'Donor'} text={nextPickup?.pickupAddress || 'Address unlocked after acceptance'} />
                    <RoutePoint icon={<MapPin size={31} />} label="Drop-Off" title={nextPickup?.acceptedBy?.name || 'Receiving NGO'} text={nextPickup?.deliveryAddress || 'NGO Hub'} />
                    <div className="volunteer-estimate-row">
                      <span><Package size={24} /></span>
                      <p>Estimated: <strong>~{nextPickup.estimatedMeals || '?'} meals ({nextPickup.foodType ? titleCase(nextPickup.foodType) : 'Various'})</strong></p>
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
              ) : (
                <div style={{ padding: '24px', color: '#7b818a', textAlign: 'center' }}>
                  <Truck size={36} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
                  <p style={{ margin: 0 }}>No pickups scheduled yet.</p>
                  <p style={{ margin: '4px 0 0', fontSize: '13px' }}>Claim a task below to get started.</p>
                </div>
              )}
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
                      <small>{task.distanceLabel || `${(index + 1) * 1.2} miles away`} &middot; {task.expires || 'Expires soon'}</small>
                    </div>
                    <button type="button" onClick={() => accept(task._id)}>Claim</button>
                  </article>
                ))}
                {!dashboardTasks.length && <p style={{ color: '#7b818a', padding: '10px 0' }}>No urgent tasks available.</p>}
              </div>
            </section>
          </div>

          <aside className="volunteer-side-column">
            <article className="volunteer-goal-card">
              <h3><Award size={31} /> Monthly Goal</h3>
              {data.performance?.monthlyGoalKg ? (
                <>
                  <div><span>{data.performance.rankLabel || 'Active Volunteer'}</span><strong>{data.performance.monthlyGoalProgress || 0}% Complete</strong></div>
                  <i><b style={{ width: `${data.performance.monthlyGoalProgress || 0}%` }} /></i>
                  <p>Rescue <strong>{data.performance.monthlyGoalKg} kg</strong> of food this month. <strong>{data.performance.monthlyGoalRemaining || 0} kg</strong> remaining.</p>
                </>
              ) : (
                <p style={{ color: '#7b818a', padding: '8px 0' }}>Set a monthly rescue goal in your profile to track progress here.</p>
              )}
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

      {/* ── Active Pickups Redesigned Section ── */}
      <section className="ap-workspace-page" id="assigned-deliveries" data-dashboard-section="assigned-deliveries">
        <div className="ap-header-row">
          <div className="ap-title-area">
            <h2>Active Pickups</h2>
            <p>Manage your ongoing food rescue operations in real-time.</p>
          </div>
          <span className="ap-live-chip">
            <span className="ap-dot" />
            {assignedDeliveries.filter(d => d.status !== 'delivered').length} LIVE {assignedDeliveries.filter(d => d.status !== 'delivered').length === 1 ? 'TASK' : 'TASKS'}
          </span>
        </div>

        <div className="ap-workspace-grid">
          {/* Left Column: Active Pickup Details */}
          <div className="ap-main-column">
            {activePickup ? (
              <div className="ap-details-card">
                {/* Card Header */}
                <div className="ap-card-header">
                  <div className="ap-header-left">
                    <span className="ap-icon-box">
                      <Truck size={28} />
                    </span>
                    <div>
                      <h3>{activePickup.title}</h3>
                      <small>ID: {activePickupId || 'FR-2026-003'}</small>
                    </div>
                  </div>
                  <div className="ap-header-right">
                    <span className={`ap-status-badge ${activePickupStatus}`}>
                      {activePickupStatusLabel}
                    </span>
                    <small>Est. Arrival: {activeEtaLabel || '15 mins'}</small>
                  </div>
                </div>

                {/* Progress stages */}
                <div className="ap-progress-section">
                  <div className="ap-progress-labels">
                    <span className={activePickupStatus ? 'active' : ''}>ASSIGNED</span>
                    <span className={['picked_up', 'delivered'].includes(activePickupStatus) ? 'active' : ''}>IN TRANSIT</span>
                    <span className={activePickupStatus === 'delivered' ? 'active' : ''}>DELIVERED</span>
                  </div>
                  <div className="ap-progress-bar-container">
                    <div className="ap-progress-fill" style={{ width: activePickupProgress }} />
                  </div>
                </div>

                <div className="ap-info-grid">
                  <div className="ap-info-block">
                    <h4><Store size={18} /> DONOR INFORMATION</h4>
                    <div className="ap-info-content-box">
                      <strong>{activeDonorName}</strong>
                      <p>{activeDonorRole || 'Manager, Logistics'}</p>
                      {isAwaitingAcceptance ? (
                        <p style={{ color: '#c05621', fontWeight: 'bold' }}>Locked until task is accepted</p>
                      ) : (
                        <>
                          <strong className="ap-phone-text">{activeDonorPhone || 'Not provided'}</strong>
                          <p>{activePickup.pickupAddress}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="ap-info-block">
                    <h4><Soup size={18} /> RECIPIENT NGO</h4>
                    <div className="ap-info-content-box">
                      <strong>{activeRecipientName || 'Hope Community Kitchen'}</strong>
                      <p>Delivery Window: {activeDeliveryWindowLabel || 'Closes at 6:00 PM'}</p>
                      {isAwaitingAcceptance ? (
                        <p style={{ color: '#c05621', fontWeight: 'bold' }}>Locked until task is accepted</p>
                      ) : (
                        <p>{activeDropoffAddress || 'NGO Hub'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Special instructions */}
                <div className="ap-instructions-box">
                  <div className="ap-instructions-heading">
                    <AlertCircle size={18} />
                    <span>Special Instructions</span>
                  </div>
                  {isAwaitingAcceptance ? (
                    <p style={{ color: '#7b818a', fontStyle: 'italic' }}>Instructions will be visible once the task is accepted.</p>
                  ) : (
                    <p>{activeInstructions || 'Safe surplus food dispatch.'}</p>
                  )}
                </div>

                {/* Actions footer */}
                <div className="ap-card-footer">
                  {isAwaitingAcceptance ? (
                    <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                      <button
                        type="button"
                        className="ap-btn-pickup"
                        style={{ flex: 1, backgroundColor: '#83531b', borderColor: '#83531b', color: '#fff' }}
                        onClick={() => acceptAssignment(activePickup._id)}
                      >
                        Accept Assignment
                      </button>
                    </div>
                  ) : (
                    <div className="ap-footer-actions-left">
                      <button type="button" className="ap-btn-nav" onClick={() => window.open(activePickupDirectionsUrl, '_blank')}>
                        <Navigation size={16} /> Start Navigation
                      </button>
                      {activePickupStatus === 'posted' || activePickupStatus === 'accepted' || (activePickupStatus === 'pickup_scheduled' && activePickup.volunteerAccepted) ? (
                        <button type="button" className="ap-btn-pickup" onClick={async () => { await updateStatus(activePickup._id, 'picked_up'); }}>
                          Mark as Picked Up
                        </button>
                      ) : (
                        <button type="button" className="ap-btn-pickup" onClick={async () => { await updateStatus(activePickup._id, 'delivered'); }} disabled={activePickupStatus === 'delivered'}>
                          Mark as Delivered
                        </button>
                      )}
                    </div>
                  )}
                  {!isAwaitingAcceptance && (
                    <button type="button" className="ap-btn-help"><HelpCircle size={16} /> Help/Support</button>
                  )}
                </div>
              </div>
            ) : (
              <div className="ap-empty-state">
                <p>No active pickups at the moment. Claim a task from Available Tasks to start.</p>
              </div>
            )}
          </div>

          {/* Right Column: Sidebar */}
          <div className="ap-sidebar-column">
            {/* Live Map Preview Card */}
            <div className="ap-map-card">
              <div className="ap-map-card-header">
                <span>10:09 AM</span>
                <h3>MY PICKUPS</h3>
              </div>
              <div className="ap-map-card-iframe">
                {isAwaitingAcceptance ? (
                  <div style={{ display: 'grid', placeItems: 'center', height: '100%', background: '#f7fafc', color: '#718096', textAlign: 'center', padding: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Lock size={32} />
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '600' }}>Map locked until accepted</p>
                    </div>
                  </div>
                ) : (
                  <iframe title="My Pickups Route Map" src={activePickupMapSrc || 'https://maps.google.com/maps?q=Manhattan,%20New%20York&t=m&z=14&output=embed'} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                )}
              </div>
              <div className="ap-map-card-footer">
                <span className="ap-map-footer-label">CURRENT LOCATION</span>
                <div className="ap-map-footer-row">
                  <strong>5th Ave & 23rd St</strong>
                  <span className="ap-map-pin-btn"><MapPin size={16} /></span>
                </div>
              </div>
            </div>

            {/* Next Scheduled Pickup Card */}
            {nextAssignedPickup && (
              <div className="ap-scheduled-card">
                <div className="ap-scheduled-header">
                  <span>NEXT SCHEDULED PICKUP</span>
                  <span className="ap-scheduled-badge">{titleCase(nextAssignedPickup.status)}</span>
                </div>
                <h3>{nextAssignedPickup.title}</h3>
                <div className="ap-scheduled-time">
                  <Clock size={16} />
                  <span>Pickup: {formatDate(nextAssignedPickup.pickupWindowStart || nextAssignedPickup.createdAt)}</span>
                </div>
                <button type="button" className="ap-scheduled-btn" onClick={() => setSelectedId(nextAssignedPickup._id)}>View Details</button>
              </div>
            )}

            {/* Emergency Support Card */}
            <div className="ap-support-card">
              <span className="ap-support-icon"><HelpCircle size={22} /></span>
              <div>
                <h3>Emergency Support</h3>
                <p>Talk to a live dispatcher for issues.</p>
                <a href="#support">Contact Dispatch →</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Delivery History Redesigned Section ── */}
      <section className="dh-workspace-page" id="delivery-history" data-dashboard-section="delivery-history">
        {/* Top Banner Row */}
        <div className="dh-banner-row">
          {/* Community Champion Card */}
          <div className="dh-champion-card">
            <span className="dh-champion-badge">COMMUNITY CHAMPION</span>
            <h2 className="dh-champion-title">
              You've helped feed <span className="dh-highlight">{Number(impactCount || 0).toLocaleString()}</span> families this month.
            </h2>
            <p className="dh-champion-subtitle">
              Your consistent pickups from local markets are making a direct difference in reducing food waste and hunger in the Seattle Area.
            </p>
            <div className="dh-champion-stats">
              <div>
                <small>TOTAL RESCUED</small>
                <strong>{Number(data.performance?.totalWeight ?? 0).toLocaleString()} kg</strong>
              </div>
              <div>
                <small>TOTAL POINTS</small>
                <strong>{pointsEarned.toLocaleString()} XP</strong>
              </div>
            </div>
          </div>

          {/* Service Record Card */}
          <div className="dh-service-card">
            <div className="dh-service-header">
              <span className="dh-service-icon"><ShieldCheck size={24} /></span>
              <span className="dh-service-active">
                <span className="dh-active-dot" />
                Q3 ACTIVE
              </span>
            </div>
            <h3>Service Record</h3>
            <p>Download your verified volunteer service certificate for professional or academic credentials.</p>
            <button type="button" className="dh-download-btn"><Download size={16} /> Download Certificate</button>
          </div>
        </div>

        {/* Delivery History Table Card */}
        <div className="dh-table-card">
          <div className="dh-table-header">
            <div>
              <h3>Delivery History</h3>
              <p>Detailed log of your recent food rescue missions.</p>
            </div>
            <div className="dh-table-actions">
              <button type="button" className="dh-filter-btn"><Filter size={14} /> Filter</button>
              <button type="button" className="dh-filter-btn"><Calendar size={14} /> Date Range</button>
            </div>
          </div>

          <div className="dh-table-wrap">
            <table className="dh-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>TASK TYPE</th>
                  <th>ITEMS DELIVERED</th>
                  <th>WEIGHT</th>
                  <th>IMPACT XP</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const mockRows = [
                    { date: 'Oct 24, 2023', icon: 'bag', type: 'Supermarket Surplus', items: 'Bakery, Dairy, Fresh Produce', weight: '42.5 kg', xp: '+150 XP' },
                    { date: 'Oct 22, 2023', icon: 'utensils', type: 'Restaurant Pickup', items: 'Prepared Meals (15 boxes)', weight: '12 kg', xp: '+85 XP' },
                    { date: 'Oct 19, 2023', icon: 'leaf', type: "Farmer's Market Bulk", items: 'Seasonal Vegetables, Fruit', weight: '115.8 kg', xp: '+420 XP' },
                    { date: 'Pantry Restock', icon: 'package', type: 'Pantry Restock', items: 'Canned Goods, Dry Pasta', weight: '65 kg', xp: '+110 XP' },
                    { date: 'Oct 12, 2023', icon: 'coffee', type: 'Cafe Surplus', items: 'Sandwiches, Pastries', weight: '8.4 kg', xp: '+45 XP' }
                  ];
                  const realRows = (history.length ? history : []).map(d => ({
                    date: formatDate ? formatDate(d.createdAt || d.pickupDate) : (d.createdAt || ''),
                    icon: d.foodType === 'bakery' ? 'bag' : d.foodType === 'produce' ? 'leaf' : 'utensils',
                    type: d.title || titleCase(d.foodType || 'Delivery'),
                    items: d.description || d.foodType || '',
                    weight: (d.quantity || d.estimatedMeals || 0) + ' kg',
                    xp: '+' + Math.round((d.estimatedMeals || 10) * 3.5) + ' XP',
                    _id: d._id,
                  }));
                  const rows = realRows;
                  const iconMap = {
                    bag: <ShoppingBag size={18} />,
                    utensils: <Utensils size={18} />,
                    leaf: <Leaf size={18} />,
                    package: <Package size={18} />,
                    coffee: <Coffee size={18} />,
                  };
                  if (!rows.length) {
                    return (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#7b818a' }}>
                          No delivery history logs recorded yet.
                        </td>
                      </tr>
                    );
                  }
                  return rows.map((row, idx) => (
                    <tr key={row._id || idx}>
                      <td className="dh-cell-date">{row.date}</td>
                      <td className="dh-cell-type">
                        <span className="dh-type-icon">{iconMap[row.icon] || <Package size={18} />}</span>
                        <span>{row.type}</span>
                      </td>
                      <td className="dh-cell-items">{row.items}</td>
                      <td className="dh-cell-weight"><strong>{row.weight}</strong></td>
                      <td className="dh-cell-xp">{row.xp}</td>
                      <td className="dh-cell-menu">
                        <button type="button" className="dh-menu-btn"><MoreVertical size={16} /></button>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
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

      {/* ── Messages / Chat Section ── */}
      <section className="messages-inbox-page" id="messages" data-dashboard-section="messages">
        <div className="messages-layout">
          <div className="chats-sidebar">
            <div className="chats-sidebar-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} />
                <div>
                  <h3 style={{ margin: '0', fontWeight: '800', color: '#22252a' }}>Messenger</h3>
                  <p style={{ margin: '2px 0 0 0', color: '#7b818a', fontWeight: '500' }}>Chat with NGO & Donor</p>
                </div>
              </div>
            </div>
            <div className="chats-list">
              {chatContacts.map((contact) => (
                <div
                  className={`chat-list-item ${selectedContact?._id === contact._id ? 'active-chat' : ''}`}
                  key={contact._id}
                  onClick={() => setSelectedContact(contact)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="chat-item-avatar-placeholder"><span>{contact.name?.slice(0, 2).toUpperCase()}</span></div>
                  <div className="chat-item-info">
                    <div className="chat-item-row">
                      <strong>{contact.name}</strong>
                      <span className="chat-status" style={{ fontSize: '11px', textTransform: 'uppercase' }}>{contact.role || ''}</span>
                    </div>
                    {contact.phone && <p className="chat-preview" style={{ fontSize: '11px' }}>{contact.phone}</p>}
                  </div>
                </div>
              ))}
              {!chatContacts.length && <p style={{ padding: '16px', color: '#7b818a' }}>No active chats yet.</p>}
            </div>
          </div>

          <div className="chats-content">
            {selectedContact ? (
              <>
                <div className="chat-thread-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="chat-item-avatar-placeholder" style={{ width: 36, height: 36 }}><span>{selectedContact.name?.slice(0, 2).toUpperCase()}</span></div>
                    <div>
                      <h4 style={{ margin: '0 0 2px 0', fontWeight: '800', color: '#22252a' }}>{selectedContact.name}</h4>
                      <span className="header-status-label" style={{ background: '#ebf8ff', color: '#2b6cb0' }}>Live Messaging</span>
                    </div>
                  </div>
                </div>
                <div className="chat-messages-thread" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', overflowY: 'auto' }}>
                  {chatMessages.map((msg) => {
                    const isOut = msg.sender === user?._id;
                    return (
                      <div className={`message-bubble-row ${isOut ? 'outgoing' : 'incoming'}`} key={msg._id} style={{ alignSelf: isOut ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                        <div className="message-bubble" style={{ background: isOut ? 'linear-gradient(135deg,#83531b,#b87322)' : '#edf2f7', color: isOut ? '#fff' : '#2d3748', padding: '10px 14px', borderRadius: '16px', fontSize: '14px' }}>{msg.text}</div>
                        <span className="message-timestamp" style={{ fontSize: '11px', color: '#a0aec0', display: 'block', textAlign: isOut ? 'right' : 'left', marginTop: '4px' }}>{formatDate(msg.createdAt)}</span>
                      </div>
                    );
                  })}
                  {!chatMessages.length && <p style={{ textAlign: 'center', color: '#a0aec0', padding: '20px' }}>Send a message to start the conversation.</p>}
                </div>
                <form onSubmit={handleSendMessage} style={{ display: 'flex', padding: '16px', background: '#fff', borderTop: '1px solid #edf2f7' }}>
                  <input
                    type="text"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder="Type a message..."
                    style={{ flex: 1, padding: '12px 16px', borderRadius: '24px', border: '1px solid #cbd5e0', outline: 'none', fontSize: '14px' }}
                  />
                  <button type="submit" className="button button-primary" style={{ marginLeft: '12px', borderRadius: '50%', width: '42px', height: '42px', minHeight: '42px', padding: '0', display: 'grid', placeItems: 'center', background: '#83531b', boxShadow: 'none' }}>
                    <Send size={16} />
                  </button>
                </form>
              </>
            ) : (
              <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#a0aec0', textAlign: 'center' }}>
                <div><MessageSquare size={48} style={{ margin: '0 auto 12px' }} /><p>Select a contact from the sidebar to chat.</p></div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Profile Section ── */}
      <section className="prof-page" id="profile" data-dashboard-section="profile">
        <div className="prof-header">
          <div className="prof-header-text">
            <h2>{t('Profile Settings')}</h2>
            <p>{t('Manage your personal information and volunteer preferences.')}</p>
          </div>
          <div className="prof-verified-badge">
            <ShieldCheck size={16} />
            <span>{t('Active Volunteer')}</span>
          </div>
        </div>

        <div className="prof-layout">
          {/* Left Column Card (Profile Summary) */}
          <div className="prof-summary-card">
            <div className="prof-avatar-container">
              <div className="prof-avatar-outline">
                {user?.profile?.avatarUrl ? (
                  <img src={user.profile.avatarUrl} alt={profileForm.name} className="prof-avatar-img" />
                ) : (
                  <User size={48} />
                )}
                <button type="button" className="prof-avatar-edit-btn" title={t('Edit avatar')}>
                  <Edit2 size={14} />
                </button>
              </div>
            </div>
            <h3 className="prof-summary-name">{profileForm.name}</h3>
            {user?.createdAt && <span className="prof-summary-active-since">{t('Active since')} {formatDate(user.createdAt)}</span>}

            <div className="prof-divider-horizontal" />

            <div className="prof-metrics-row">
              <div className="prof-metric-item">
                <strong className="prof-metric-val">{data?.performance?.totalDeliveries ?? 0}</strong>
                <span className="prof-metric-lbl">{t('Deliveries')}</span>
              </div>
              <div className="prof-metric-item">
                <strong className="prof-metric-val">{data?.performance?.points ?? 0}</strong>
                <span className="prof-metric-lbl">{t('XP Points')}</span>
              </div>
            </div>
          </div>

          {/* Right Column Card (Form Details) */}
          <form className="prof-details-card" onSubmit={handleProfileSave}>
            <div className="prof-form-grid">
              <label className="prof-field">
                <span className="prof-field-label">{t('Full Name')}</span>
                <input type="text" name="name" value={profileForm.name} onChange={updateProfileField} required />
              </label>

              <label className="prof-field">
                <span className="prof-field-label">{t('Email Address')}</span>
                <input type="email" name="email" value={profileForm.email} onChange={updateProfileField} required />
              </label>

              <label className="prof-field">
                <span className="prof-field-label">{t('Phone Number')}</span>
                <input type="text" name="phone" value={profileForm.phone} onChange={updateProfileField} required />
              </label>

              <label className="prof-field">
                <span className="prof-field-label">{t('Vehicle Type')}</span>
                <select name="vehicleType" value={profileForm.vehicleType} onChange={updateProfileField}>
                  <option value="Bike">{t('Bike')}</option>
                  <option value="Car">{t('Car')}</option>
                  <option value="Van">{t('Van / Truck')}</option>
                  <option value="Scooter">{t('Scooter')}</option>
                  <option value="Walk">{t('Walk / Public Transit')}</option>
                </select>
              </label>

              <label className="prof-field full-width">
                <span className="prof-field-label">{t('Address')}</span>
                <input type="text" name="address" value={profileForm.address} onChange={updateProfileField} placeholder={t('Your home or base address')} />
              </label>
            </div>

            {profileNotice && (
              <div className={`prof-notice ${profileNotice.toLowerCase().includes('success') || profileNotice.toLowerCase().includes('saved') ? 'success' : 'error'}`}>
                {profileNotice}
              </div>
            )}

            <button type="submit" className="prof-save-btn">
              <Save size={16} />
              {t('Save Profile')}
            </button>
          </form>
        </div>
      </section>

      {/* ── Settings Section ── */}
      <section className="sett-page" id="settings" data-dashboard-section="settings">
        <div className="sett-header">
          <div className="sett-header-text">
            <h2>{t('Platform Settings')}</h2>
            <p>{t('Manage your account preferences, notifications, and security settings.')}</p>
          </div>
          <button type="button" className="btn-sett-save-top" onClick={handleSettingsSave}>
            <Save size={16} />
            <span>{t('Save Changes')}</span>
          </button>
        </div>

        {settingsNotice && (
          <div className="sett-notice-success">
            {settingsNotice}
          </div>
        )}

        {/* Main Two-Column Row */}
        <div className="sett-grid-two-col">
          {/* Notifications Card */}
          <div className="sett-card">
            <div className="sett-card-header">
              <div className="sett-icon-square icon-orange">
                <Bell size={20} />
              </div>
              <h3>{t('Notifications')}</h3>
            </div>

            <div className="sett-notif-list">
              <div className="sett-notif-row">
                <div className="sett-notif-text">
                  <strong>{t('Email Notifications')}</strong>
                  <span>{t('Receive delivery updates and pickup assignments')}</span>
                </div>
                <label className="sett-switch" htmlFor="vol-email-notif-toggle">
                  <input type="checkbox" id="vol-email-notif-toggle" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} />
                  <span className="sett-slider" />
                </label>
              </div>

              <div className="sett-notif-row">
                <div className="sett-notif-text">
                  <strong>{t('SMS Alerts')}</strong>
                  <span>{t('Real-time pickup confirmations and urgent tasks')}</span>
                </div>
                <label className="sett-switch" htmlFor="vol-sms-alerts-toggle">
                  <input type="checkbox" id="vol-sms-alerts-toggle" checked={smsAlerts} onChange={(e) => setSmsAlerts(e.target.checked)} />
                  <span className="sett-slider" />
                </label>
              </div>

              <div className="sett-notif-row">
                <div className="sett-notif-text">
                  <strong>{t('System Announcements')}</strong>
                  <span>{t('New platform features and community news')}</span>
                </div>
                <label className="sett-switch" htmlFor="vol-sys-ann-toggle">
                  <input type="checkbox" id="vol-sys-ann-toggle" checked={sysAnnouncements} onChange={(e) => setSysAnnouncements(e.target.checked)} />
                  <span className="sett-slider" />
                </label>
              </div>
            </div>
          </div>

          {/* Language Card */}
          <div className="sett-card">
            <div className="sett-card-header">
              <div className="sett-icon-square icon-gray">
                <Languages size={20} />
              </div>
              <h3>{t('Language')}</h3>
            </div>

            <div className="sett-lang-content">
              <p className="sett-lang-lbl">{t('Select your preferred platform language')}</p>

              <div className="sett-select-wrap">
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="sett-select">
                  <option value="en">English (United States)</option>
                  <option value="hi">Hindi (हिंदी)</option>
                </select>
              </div>

              <div className="sett-lang-info-banner">
                <Info size={18} />
                <span>{t('Changing language will reload the dashboard.')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Password Card (Full Width) */}
        <div className="sett-card full-width-card">
          <div className="sett-card-header-between">
            <div className="sett-card-header">
              <div className="sett-icon-square icon-dark">
                <Shield size={20} />
              </div>
              <h3>{t('Security & Password')}</h3>
            </div>
            <div className="sett-security-badge">
              <span className="sett-badge-dot" />
              <span>{t('Last changed 3 months ago')}</span>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="sett-security-form">
            <div className="sett-security-inputs">
              <div className="sett-field">
                <span className="sett-field-label">{t('CURRENT PASSWORD')}</span>
                <div className="sett-input-with-eye">
                  <input type={showCurrentPassword ? "text" : "password"} placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                  <button type="button" className="sett-eye-btn" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="sett-field">
                <span className="sett-field-label">{t('NEW PASSWORD')}</span>
                <input type="password" placeholder={t("Enter new password")} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              </div>

              <div className="sett-field">
                <span className="sett-field-label">{t('CONFIRM NEW PASSWORD')}</span>
                <input type="password" placeholder={t("Re-type new password")} value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required />
              </div>
            </div>

            {securityNotice && (
              <div className="sett-sec-notice-success">{securityNotice}</div>
            )}
            {securityError && (
              <div className="sett-sec-notice-error">{securityError}</div>
            )}

            <div className="sett-security-actions">
              <div className="sett-sec-left">
                <button type="submit" className="btn-sett-change-pw">{t('Change Password')}</button>
                <a href="#support" className="sett-forgot-link">{t('Forgot Password?')}</a>
              </div>
              <div className="sett-sec-right">
                <span className="sett-tfa-lbl">{t('Two-Factor Authentication:')}</span>
                <span className="sett-tfa-badge-disabled">{t('Disabled')}</span>
                <button type="button" className="btn-sett-tfa-enable">{t('Enable 2FA')}</button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* ── Support Section ── */}
      <section className="donor-support-page" id="support" data-dashboard-section="support">
        <div className="support-header-row">
          <div className="support-header-text">
            <h2>{t('Help & Support')}</h2>
            <p>{t('Have questions about pickups, deliveries, or your volunteer account? We\'re here to help 24/7.')}</p>
          </div>
        </div>

        <div className="support-main-card">
          <div className="support-faq-section">
            <h3 className="support-section-title">{t('Frequently Asked Questions')}</h3>

            <SupportFAQ
              question={t('How do I accept a pickup task?')}
              answer={t('Navigate to "Available Pickups" from the sidebar. Browse nearby tasks, review pickup and drop-off details, then click "Claim Task" to accept. You\'ll receive confirmation and route details immediately.')}
            />
            <SupportFAQ
              question={t('How does live location sharing work?')}
              answer={t('Once you accept a delivery, use the "Share Location" button on your active pickup card. This sends your GPS coordinates to the donor and NGO dashboards so they can track your progress in real time.')}
            />
            <SupportFAQ
              question={t('What if I can\'t complete a delivery?')}
              answer={t('If you\'re unable to finish a delivery, contact the NGO coordinator through the Messages section. The platform will reassign the task to another available volunteer automatically.')}
            />
            <SupportFAQ
              question={t('How are XP points calculated?')}
              answer={t('You earn XP for each completed delivery based on distance, food weight, and urgency. Bonus points are awarded for on-time pickups and positive feedback from donors and NGOs.')}
            />
          </div>

          <div className="support-divider" />

          <div className="support-contact-section">
            <h3 className="support-section-title">
              <MessageSquare size={18} />
              {t('Message Support Team')}
            </h3>
            <textarea className="support-textarea" placeholder={t('Describe your issue — e.g. a pickup wasn\'t available, you need to update your vehicle details, or have a question about the platform…')} rows={5} />
            <button className="btn-support-submit" type="button">
              <Send size={15} />
              {t('Submit Message')}
            </button>
          </div>
        </div>

        <div className="support-quick-contacts">
          <div className="support-contact-card">
            <div className="support-contact-icon email"><Mail size={24} /></div>
            <h4>{t('Email Support')}</h4>
            <p>{t('Get a response within 24 hours for non-urgent queries.')}</p>
            <a href="mailto:support@foodbridge.org">support@foodbridge.org</a>
          </div>
          <div className="support-contact-card">
            <div className="support-contact-icon phone"><Phone size={24} /></div>
            <h4>{t('Phone Support')}</h4>
            <p>{t('Speak directly with our team for urgent delivery issues.')}</p>
            <a href="tel:+911800123456">+91 1800-123-456</a>
          </div>
          <div className="support-contact-card">
            <div className="support-contact-icon chat"><MessageSquare size={24} /></div>
            <h4>{t('Live Chat')}</h4>
            <p>{t('Chat with our support agents in real-time during business hours.')}</p>
            <a href="#support">{t('Start Chat')}</a>
          </div>
        </div>
      </section>

    </DashboardShell>
  );
}

function SupportFAQ({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`support-faq-item${open ? ' open' : ''}`}>
      <button className="support-faq-q" type="button" onClick={() => setOpen(o => !o)}>
        <span>{question}</span>
        {open ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
      </button>
      {open && <p className="support-faq-a">{answer}</p>}
    </div>
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
