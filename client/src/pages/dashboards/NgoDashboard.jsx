import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Award, CalendarDays, CheckCircle2, ChevronDown, ChevronUp, Clock, Database, Download, Globe, HelpCircle, Home, Leaf, Lock, Mail, MapPin, MessageSquare, PackageCheck, Phone, Plus, RefreshCw, Scale, School, Send, Share2, Shield, Sliders, Soup, Star, TrendingUp, Truck, UserPlus, Utensils, Users, UsersRound } from 'lucide-react';
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

function getScheduledStripeClass(donation) {
  if (donation.status === 'delivered') return 'status-completed';
  if (donation.status === 'picked_up') return 'status-picked-up';
  if (donation.status === 'pickup_scheduled') return 'status-next';
  return 'status-today';
}

function getScheduledBadge(donation) {
  if (donation.status === 'delivered') return { class: 'completed', text: 'COMPLETED EARLY' };
  if (donation.status === 'picked_up') return { class: 'picked-up', text: 'PICKED UP' };
  if (donation.status === 'pickup_scheduled') return { class: 'next', text: 'NEXT IN 45M' };
  return { class: 'today', text: 'TODAY' };
}

function getPickupTimeStr(pickupWindowStart) {
  if (!pickupWindowStart) return '01:45 PM';
  const d = new Date(pickupWindowStart);
  if (isNaN(d)) return '01:45 PM';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function NgoDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data, error, refresh } = useDashboardData();
  const [selectedDonationId, setSelectedDonationId] = useState('');
  const [deliveryTarget, setDeliveryTarget] = useState('families');
  const [beneficiaryCount, setBeneficiaryCount] = useState(40);
  const [message, setMessage] = useState('');
  const [showAssignForId, setShowAssignForId] = useState('');
  const [selectedVolunteerId, setSelectedVolunteerId] = useState('');

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

  const [distanceRadius, setDistanceRadius] = useState(25);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [quantityScale, setQuantityScale] = useState('all');

  const availableDonations = data?.availableDonations || [];
  const claimedDonations = data?.acceptedDonations || [];

  const filteredDonations = useMemo(() => {
    return availableDonations.filter((donation, index) => {
      // 1. Category Filter
      const isPerishable = donation.foodType?.toLowerCase() !== 'packaged';
      if (categoryFilter === 'perishable' && !isPerishable) return false;
      if (categoryFilter === 'non-perishable' && isPerishable) return false;

      // 2. Distance Filter
      const distMatch = donation.distanceLabel?.match(/[\d.]+/);
      const dist = distMatch ? parseFloat(distMatch[0]) : (index + 1) * 2.4;
      if (dist > distanceRadius) return false;

      // 3. Quantity Scale Filter
      if (quantityScale !== 'all') {
        const qtyMatch = donation.quantity?.match(/[\d.]+/);
        const qty = qtyMatch ? parseFloat(qtyMatch[0]) : 0;
        if (quantityScale === 'small' && qty >= 20) return false;
        if (quantityScale === 'medium' && (qty < 20 || qty > 100)) return false;
        if (quantityScale === 'large' && qty <= 100) return false;
      }

      return true;
    });
  }, [availableDonations, categoryFilter, distanceRadius, quantityScale]);
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

  async function assignVolunteer(donationId) {
    if (!selectedVolunteerId) return;
    setMessage('');
    try {
      await api(`/donations/${donationId}/pickups`, {
        method: 'POST',
        body: JSON.stringify({
          assignedVolunteer: selectedVolunteerId,
          scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // scheduled in 2 hrs
          deliveryLocation: user?.profile?.serviceArea || user?.profile?.city || 'NGO Hub',
          notes: 'Standard pickup coordinated via ReliefShare dashboard.'
        })
      });
      setShowAssignForId('');
      setSelectedVolunteerId('');
      setMessage(t('Volunteer assigned successfully.'));
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

  const headerActions = (
    <button 
      className="button button-primary" 
      style={{ 
        backgroundColor: '#83531b', 
        borderColor: '#83531b', 
        color: '#ffffff', 
        borderRadius: '8px', 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '8px', 
        fontWeight: 'bold',
        padding: '8px 16px',
        fontSize: '14px'
      }}
      onClick={() => window.location.hash = '#available-donations'}
    >
      <Plus size={16} /> {t("Request Pickup")}
    </button>
  );

  // Expiry tag helper
  function getExpiryLabel(safeBefore) {
    if (!safeBefore) return t("EXPIRES SOON");
    const limit = new Date(safeBefore);
    const now = new Date();
    const diffMs = limit - now;
    const diffHrs = diffMs / (1000 * 60 * 60);

    if (diffHrs < 0) {
      return t("EXPIRED");
    } else if (diffHrs < 24) {
      const hrs = Math.max(0, Math.floor(diffHrs));
      return `EXPIRES IN ${hrs}H`;
    } else {
      return t("EXPIRES SOON");
    }
  }

  // Detailed card expiry helper
  function getCardExpiryDetails(donation) {
    if (!donation.safeBefore) {
      return { icon: CalendarDays, text: t('Expires: Dec 2026'), class: 'expiry-green' };
    }
    const isPerishable = donation.foodType?.toLowerCase() !== 'packaged';
    const limit = new Date(donation.safeBefore);
    const now = new Date();
    const diffMs = limit - now;
    const diffHrs = diffMs / (1000 * 60 * 60);

    if (isPerishable) {
      if (diffHrs < 0) {
        return { icon: Clock, text: t('Expired'), class: 'expiry-red' };
      }
      const hrs = Math.floor(diffHrs);
      const mins = Math.floor((diffHrs - hrs) * 60);
      return { icon: Clock, text: `${t('Expires in')}: ${hrs}h ${mins}m`, class: 'expiry-red' };
    } else {
      const options = { month: 'short', year: 'numeric' };
      const formattedDate = limit.toLocaleDateString(undefined, options);
      return { icon: CalendarDays, text: `${t('Expires')}: ${formattedDate}`, class: 'expiry-green' };
    }
  }

  // Calculate unassigned pickups count
  const unassignedCount = claimedDonations.filter(d => !d.assignedVolunteer).length || 1;

  return (
    <DashboardShell eyebrow="NGO Dashboard" title="Dashboard Overview" actions={headerActions}>
      <section className="ngo-dashboard-overview-tab" id="ngo-home">
        {/* Welcome Block */}
        <div className="ngo-view-header">
          <div className="welcome-info">
            <p>
              {t("Welcome back")}, {user?.name?.split(' ')[0] || 'Sarah'}. {t("You have")}{' '}
              <span className="unassigned-badge-text">{unassignedCount} {t("unassigned")}</span> {t("pickups nearby")}.
            </p>
            <h2>{t("Dashboard Overview")}</h2>
          </div>
          <div className="ngo-date-selector">
            <CalendarDays size={16} />
            <span>Oct 12 - Oct 19, 2026</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="ngo-stats-grid">
          <div className="ngo-stat-card">
            <span className="stat-label">{t("Total Food Collected")}</span>
            <div className="stat-value-row">
              <span className="stat-value">
                {data.reports?.foodReceived ? Math.round(data.reports.foodReceived).toLocaleString() : '0'} <small>kg</small>
              </span>
              <span className="stat-badge success">
                <TrendingUp size={12} />
                + 12%
              </span>
            </div>
            {/* Sparkline Visual */}
            <svg className="stat-sparkline" viewBox="0 0 70 24" fill="none">
              <path d="M0 20 C10 18 15 10 25 12 C35 14 45 4 55 8 C65 12 68 2 70 2" stroke="#78be21" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          <div className="ngo-stat-card">
            <span className="stat-label">{t("Active Pickups")}</span>
            <div className="stat-value-row">
              <span className="stat-value">
                {claimedDonations.filter(d => d.status !== 'delivered' && d.status !== 'cancelled').length}
              </span>
              <span className="stat-badge progress-badge">
                <Award size={11} />
                {claimedDonations.filter(d => ['pickup_scheduled', 'picked_up'].includes(d.status)).length} {t("in progress")}
              </span>
            </div>
          </div>

          <div className="ngo-stat-card">
            <span className="stat-label">{t("Shelters Served")}</span>
            <div className="stat-value-row">
              <span className="stat-value">{data.reports?.beneficiaryTargets?.shelters || 0}</span>
              <span className="stat-badge pending-badge">
                <Award size={11} />
                {data.reports?.beneficiaryTargets?.orphanages || 0} {t("orphanages")}
              </span>
            </div>
          </div>

          <div className="ngo-stat-card">
            <span className="stat-label">{t("Volunteer Count")}</span>
            <div className="stat-value-row">
              <span className="stat-value">{data.volunteers?.length || 0}</span>
              <span className="stat-badge success">
                <TrendingUp size={12} />
                + {data.volunteers?.length ? Math.min(4, data.volunteers.length) : 0}
              </span>
            </div>
            {/* Sparkline Visual */}
            <svg className="stat-sparkline" viewBox="0 0 70 24" fill="none">
              <path d="M0 18 C10 15 20 5 30 8 C40 11 50 2 60 4 C65 5 68 1 70 1" stroke="#78be21" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Double Columns Grid */}
        <div className="ngo-layout-columns">
          {/* Left Column (Urgent & Heatmap) */}
          <div className="ngo-column-main">
            {/* Urgent Donations Panel */}
            <div className="ngo-section-panel">
              <div className="panel-header">
                <div className="panel-title-wrapper">
                  <AlertTriangle size={18} />
                  <h3 className="panel-title">{t("Urgent Donations Available")}</h3>
                </div>
                <a href="#available-donations" className="panel-link">
                  {t("View All")} &gt;
                </a>
              </div>

              <div className="urgent-cards-list">
                {availableDonations.slice(0, 2).map((donation, index) => {
                  const isPerishable = donation.foodType?.toLowerCase() !== 'packaged';
                  return (
                    <div className="urgent-horizontal-card" key={donation._id || index}>
                      <div className="urgent-card-media">
                        <img 
                          src={donation.imageUrl || (isPerishable ? "https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?auto=format&fit=crop&w=400&q=80" : "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=400&q=80")} 
                          alt={donation.title} 
                        />
                        <div className="urgent-media-overlay-left">
                          <span className={`urgent-badge-pill ${isPerishable ? 'perishable' : 'non-perishable'}`}>
                            {isPerishable ? t("Perishable") : t("Non-Perishable")}
                          </span>
                          <span className="urgent-badge-pill distance">{donation.distanceLabel || `${(index + 1) * 2.4} km away`}</span>
                        </div>
                        <div className="urgent-expiry-tag">{getExpiryLabel(donation.safeBefore)}</div>
                      </div>
                      <div className="urgent-card-body">
                        <div className="urgent-card-header">
                          <h3>{donation.title}</h3>
                          <p>{donation.donor?.profile?.organizationName || donation.donor?.name || t('Registered food donor')}</p>
                        </div>
                        <div className="urgent-card-footer">
                          <div className="urgent-stat-box">
                            <span className="urgent-stat-val">{donation.quantity}</span>
                            <span className="urgent-stat-lbl">{t(donation.foodType?.toUpperCase() || 'BAKED GOODS')}</span>
                          </div>
                          <button className="ngo-btn-primary" onClick={() => accept(donation._id)}>
                            {t("Claim Pickup")}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {availableDonations.length === 0 && (
                  <p style={{ color: 'var(--ngo-text-muted)', fontSize: '14px' }}>{t("No urgent donations available.")}</p>
                )}
              </div>
            </div>

            {/* Heatmap Card */}
            <div className="heatmap-card">
              <div className="heatmap-inner-card">
                <MapPin size={32} />
                <h3>{t("Interactive Heatmap")}</h3>
                <p>{t("Real-time donation density in your assigned district.")}</p>
                <a href="#available-donations" onClick={(e) => { e.preventDefault(); window.location.hash = '#available-donations'; }}>{t("OPEN MAP VIEW")}</a>
              </div>
            </div>
          </div>

          {/* Right Column (Recent & Milestone) */}
          <div className="ngo-column-side">
            {/* Recent Activity Panel */}
            <div className="ngo-section-panel">
              <h3 className="panel-title" style={{ marginBottom: '20px' }}>{t("Recent Activity")}</h3>
              
              <div className="activity-list">
                {(data.notifications || []).slice(0, 4).map((notif, index) => (
                  <div className="activity-item delivered" key={notif._id || index}>
                    <div className="activity-icon-dot" />
                    <div className="activity-content">
                      <strong>{t(notif.title)}</strong>
                      <p>{t(notif.message)}</p>
                      <span>{formatDate(notif.createdAt)}</span>
                    </div>
                  </div>
                ))}
                {!data.notifications?.length && (
                  <p style={{ color: 'var(--ngo-text-muted)', fontSize: '14px' }}>{t("No recent activity.")}</p>
                )}
              </div>
            </div>

            {/* Impact Milestone */}
            <div className="milestone-card">
              <div className="milestone-header">
                <Award size={16} />
                <h3>{t("Impact Milestone")}</h3>
              </div>
              <p>
                {t("You've rescued")} <span>{data.reports?.foodReceived ? Math.round(data.reports.foodReceived).toLocaleString() : '0'} kg</span> {t("of verified food.")}
              </p>
              <div className="milestone-progress-bar">
                <div className="milestone-progress-fill" style={{ width: `${data.reports?.milestoneProgress || 0}%` }} />
              </div>
              <div className="milestone-labels">
                <span>{data.reports?.foodReceived ? Math.round(data.reports.foodReceived).toLocaleString() : '0'} KG</span>
                <span>{(data.reports?.milestoneGoal || 15000).toLocaleString()} KG GOAL</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {message && <div className="notice">{t(message)}</div>}

      <section className="ngo-available-donations-page" id="available-donations">
        {/* Header Block */}
        <div className="available-page-header">
          <div className="header-text">
            <h2>{t("Available Donations")}</h2>
            <p>{t("Discover and claim fresh surplus food donations near your distribution hub.")}</p>
          </div>
          <div className="header-actions">
            <button className="btn-outline-grey" onClick={() => window.location.hash = '#ngo-home'}>
              <MapPin size={16} />
              {t("Map View")}
            </button>
            <button className="btn-solid-gold" onClick={() => window.location.hash = '#claimed-donations'}>
              <Clock size={16} />
              {t("Pickup History")}
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="available-filters-row">
          {/* Card 1: Distance Radius */}
          <div className="filter-card">
            <span className="filter-title">{t("Distance Radius")}</span>
            <div className="slider-container">
              <input 
                type="range" 
                min="1" 
                max="50" 
                value={distanceRadius}
                onChange={(e) => setDistanceRadius(Number(e.target.value))}
                className="filter-slider"
              />
              <span className="slider-val"><strong>{distanceRadius}</strong> km</span>
            </div>
          </div>

          {/* Card 2: Food Category */}
          <div className="filter-card">
            <span className="filter-title">{t("Food Category")}</span>
            <div className="pill-group">
              <button 
                className={categoryFilter === 'all' ? 'pill-btn active' : 'pill-btn'}
                onClick={() => setCategoryFilter('all')}
              >
                {t("All Types")}
              </button>
              <button 
                className={categoryFilter === 'perishable' ? 'pill-btn active' : 'pill-btn'}
                onClick={() => setCategoryFilter('perishable')}
              >
                {t("Perishable")}
              </button>
              <button 
                className={categoryFilter === 'non-perishable' ? 'pill-btn active' : 'pill-btn'}
                onClick={() => setCategoryFilter('non-perishable')}
              >
                {t("Non-Perishable")}
              </button>
            </div>
          </div>

          {/* Card 3: Quantity Scale */}
          <div className="filter-card">
            <span className="filter-title">{t("Quantity Scale")}</span>
            <select 
              className="filter-select"
              value={quantityScale}
              onChange={(e) => setQuantityScale(e.target.value)}
            >
              <option value="all">{t("Any Quantity")}</option>
              <option value="small">{t("Small (< 20kg)")}</option>
              <option value="medium">{t("Medium (20-100kg)")}</option>
              <option value="large">{t("Large (> 100kg)")}</option>
            </select>
          </div>
        </div>

        {/* Available Cards Grid */}
        <div className="available-cards-grid">
          {filteredDonations.map((donation, index) => {
            const isPerishable = donation.foodType?.toLowerCase() !== 'packaged';
            const expiry = getCardExpiryDetails(donation);
            const ExpiryIcon = expiry.icon;

            return (
              <div className="available-premium-card" key={donation._id || index}>
                {/* Media header block */}
                <div className="card-media-header">
                  <img 
                    src={donation.imageUrl || (isPerishable ? "https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?auto=format&fit=crop&w=400&q=80" : "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=400&q=80")} 
                    alt={donation.title} 
                  />
                  <div className="media-overlay-left">
                    <span className={`overlay-badge ${isPerishable ? 'perishable' : 'non-perishable'}`}>
                      {isPerishable ? t("Perishable") : t("Non-Perishable")}
                    </span>
                    <span className="overlay-badge distance">
                      {donation.distanceLabel || `${((index + 1) * 1.8).toFixed(1)} km away`}
                    </span>
                  </div>
                </div>

                {/* Content body block */}
                <div className="card-content-body">
                  <h3>{donation.title}</h3>
                  <p className="donor-org">{donation.donor?.profile?.organizationName || donation.donor?.name || t('Registered food donor')}</p>
                  
                  <div className="meta-details-list">
                    <div className="meta-row">
                      <Scale size={15} />
                      <span>{t("Quantity")}: <strong>{donation.quantity}</strong></span>
                    </div>
                    <div className={`meta-row ${expiry.class}`}>
                      <ExpiryIcon size={15} />
                      <span>{expiry.text}</span>
                    </div>
                    <div className="meta-row">
                      <MapPin size={15} />
                      <span>{donation.status === 'posted' ? `${donation.city || 'Local Area'} (${t('Exact address visible after claiming')})` : (donation.pickupAddress || t('452 Oak St, Central Hub'))}</span>
                    </div>
                  </div>

                  {/* Actions footer block */}
                  <div className="card-action-footer">
                    <button className="btn-request-pickup" onClick={() => accept(donation._id)}>
                      {t("Request Pickup")}
                    </button>
                    <button className="btn-share-icon" aria-label="Share">
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredDonations.length === 0 && (
            <div className="empty-results-fallback">
              <PackageCheck size={48} />
              <p>{t("No available donations match your selected filters.")}</p>
            </div>
          )}
        </div>
      </section>

      <section className="ngo-panel" id="claim-workflow" style={{ display: 'none' }}>
        {/* Hidden timeline support section */}
      </section>

      <section className="sched-pickups-page" id="claimed-donations">
        {/* Page Header */}
        <div className="sched-page-header">
          <div className="sched-header-text">
            <h2>{t("Scheduled Pickups")}</h2>
            <p>{t("Manage and monitor logistical coordination for upcoming donations.")}</p>
          </div>
          <div className="sched-header-actions">
            <button className="btn-outline-grey">
              <CalendarDays size={16} />
              {t("Calendar View")}
            </button>
            <button className="btn-solid-gold" onClick={() => window.location.hash = '#available-donations'}>
              <Plus size={16} />
              {t("New Pickup")}
            </button>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="sched-two-col">
          {/* Left sidebar */}
          <div className="sched-left-sidebar">
            {/* Today's Overview */}
            <div className="sched-overview-box">
              <h3>{t("Today's Overview")}</h3>
              <div className="sched-overview-row">
                <span>{t("Total Pickups")}</span>
                <strong>{claimedDonations.length || 3}</strong>
              </div>
              <div className="sched-overview-row">
                <span>{t("Pending Assign")}</span>
                <strong className="sched-count-orange">{claimedDonations.filter(d => !d.assignedVolunteer).length || 1}</strong>
              </div>
              <div className="sched-overview-row">
                <span>{t("In Progress")}</span>
                <strong className="sched-count-blue">{claimedDonations.filter(d => d.status === 'pickup_scheduled' || d.status === 'picked_up').length || 2}</strong>
              </div>
            </div>

            {/* Live Routes */}
            <div className="sched-routes-box">
              <div className="sched-routes-header">
                <span>{t("Live Routes")}</span>
                <a href="#notifications" className="sched-routes-link">{t("View Full Map")}</a>
              </div>
              <div className="sched-mini-map">
                {selectedDonation?.pickupAddress && selectedDonation?.status !== 'posted' ? (
                  <iframe
                    title="Mini Route Map"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(`${selectedDonation.pickupAddress} ${selectedDonation.city || ''}`)}&output=embed`}
                    style={{ width: '100%', height: '100%', border: 'none', borderRadius: '12px' }}
                  />
                ) : selectedDonation?.status === 'posted' ? (
                  <div className="sched-mini-map-placeholder">
                    <Lock size={28} />
                    <span>{t("Claim donation to view map")}</span>
                  </div>
                ) : (
                  <div className="sched-mini-map-placeholder">
                    <MapPin size={28} />
                    <span>{t("Mini Route Map")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right pickup cards list */}
          <div className="sched-cards-list">
            {claimedDonations.map((donation, index) => {
              const badge = getScheduledBadge(donation);
              const stripeClass = getScheduledStripeClass(donation);
              const isUnassigned = !donation.assignedVolunteer;
              const isDelivered = donation.status === 'delivered';
              const timeStr = getPickupTimeStr(donation.pickupWindowStart);

              return (
                <div
                  className={`sched-pickup-card ${stripeClass}`}
                  key={donation._id || index}
                  onClick={() => setSelectedDonationId(donation._id)}
                >
                  {/* Top row: badge + time */}
                  <div className="sched-card-top">
                    <span className={`sched-status-badge ${badge.class}`}>{badge.text}</span>
                    <span className="sched-card-time">{timeStr}</span>
                  </div>

                  {/* Title + location */}
                  <div className="sched-card-title-block">
                    <h3>{donation.title}</h3>
                    <p>
                      <MapPin size={13} />
                      {donation.pickupAddress || (index === 0 ? 'City Hospital, Building B' : index === 1 ? 'Downtown Pantry, Loading Dock 1' : 'Community Center')}
                      {' '}· <strong>{donation.quantity}</strong>
                    </p>
                  </div>

                  {/* Details row: volunteer + vehicle */}
                  <div className="sched-card-details">
                    <div className="sched-detail-col">
                      <span className="sched-detail-label">{t("ASSIGNED VOLUNTEER")}</span>
                      {isUnassigned ? (
                        <span className="sched-volunteer-unassigned">
                          <AlertTriangle size={13} />
                          {t("Unassigned")}
                        </span>
                      ) : (
                        <span className="sched-volunteer-name">
                          <Users size={13} />
                          {donation.assignedVolunteer?.name || t('Unassigned')}
                          <span style={{
                            fontSize: '10px', padding: '2px 6px', borderRadius: '8px', marginLeft: '6px',
                            background: donation.volunteerAccepted ? '#c6f6d5' : '#feebc8',
                            color: donation.volunteerAccepted ? '#22543d' : '#c05621',
                            fontWeight: 'bold', display: 'inline-block'
                          }}>
                            {donation.volunteerAccepted ? t('Confirmed') : t('Awaiting')}
                          </span>
                        </span>
                      )}
                    </div>
                    <div className="sched-detail-col">
                      <span className="sched-detail-label">{t("VEHICLE INFO")}</span>
                      <span className="sched-vehicle-info">
                        <Truck size={13} />
                        {donation.assignedVolunteer?.profile?.vehicleType || (index === 0 ? 'Sprinter Van (ABC-1234)' : index === 1 ? 'Box Truck (RE-9902)' : 'E-Cargo Bike (BK-01)')}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons column */}
                  <div className="sched-card-actions">
                    {isDelivered ? (
                      <>
                        <button className="sched-btn-locked" disabled>
                          <Lock size={13} /> {t("Locked")}
                        </button>
                        <a href="#reports" className="sched-view-link">{t("View Receipt")}</a>
                      </>
                    ) : (
                      <>
                        <button className="sched-btn-reschedule">{t("Reschedule")}</button>
                        {isUnassigned ? (
                          <button
                            className="sched-btn-assign"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowAssignForId(showAssignForId === donation._id ? '' : donation._id);
                              setSelectedVolunteerId(data.volunteers?.[0]?._id || '');
                            }}
                          >
                            {t("Assign Now")}
                          </button>
                        ) : (
                          <button
                            className="sched-btn-assign"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowAssignForId(showAssignForId === donation._id ? '' : donation._id);
                              setSelectedVolunteerId(donation.assignedVolunteer?._id || '');
                            }}
                          >
                            {t("Reassign")}
                          </button>
                        )}
                        <a href="#reports" className="sched-view-link">{t("VIEW DETAILS")}</a>
                      </>
                    )}
                  </div>

                  {/* Inline volunteer assign panel */}
                  {showAssignForId === donation._id && (
                    <div className="sched-assign-panel">
                      <h4>{t("Select Volunteer")}</h4>
                      <div className="sched-assign-row">
                        <select
                          value={selectedVolunteerId}
                          onChange={(e) => setSelectedVolunteerId(e.target.value)}
                          className="filter-select"
                        >
                          {(data.volunteers || []).map(v => (
                            <option key={v._id} value={v._id}>{v.name}</option>
                          ))}
                          {!data.volunteers?.length && <option value="">{t('No volunteers available')}</option>}
                        </select>
                        <button
                          className="btn-request-pickup"
                          style={{ padding: '8px 18px', fontSize: '13px' }}
                          onClick={(e) => { e.stopPropagation(); assignVolunteer(donation._id); }}
                        >
                          {t("Confirm")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {!claimedDonations.length && (
              <div className="empty-results-fallback">
                <Truck size={48} />
                <p>{t("No scheduled pickups yet. Claim available donations to get started.")}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="ngo-volunteers-page" id="volunteers">
        {/* Header Block */}
        <div className="volunteers-header-row">
          <div className="volunteers-header-text">
            <h2>{t("Volunteer Logistics Crew")}</h2>
            <p>{t("Coordinate certified drivers, dispatch couriers, and monitor customer rating feedback.")}</p>
          </div>
          <button className="btn-onboard-volunteer">
            <UserPlus size={16} />
            {t("Onboard Volunteer")}
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="volunteers-metrics-row">
          <div className="volunteer-metric-card">
            <span className="v-metric-label">{t("TOTAL DISPATCH CREW")}</span>
            <strong>{t("5 Active Couriers")}</strong>
          </div>
          <div className="volunteer-metric-card">
            <span className="v-metric-label">{t("OVERALL DELIVERY RATING")}</span>
            <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Star size={20} fill="#e2973c" stroke="#e2973c" />
              {t("4.9 / 5.0")}
            </strong>
          </div>
          <div className="volunteer-metric-card">
            <span className="v-metric-label">{t("CERTIFIED VEHICLES")}</span>
            <strong style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={20} style={{ color: '#83531b' }} />
              {t("5 Units")}
            </strong>
          </div>
        </div>

        {/* Table Card */}
        <div className="volunteers-table-card">
          <div className="completed-table-wrapper" style={{ overflow: 'visible' }}>
            <table className="completed-table">
              <thead>
                <tr>
                  <th>{t("COURIER NAME")}</th>
                  <th>{t("LOGISTICS VEHICLE")}</th>
                  <th>{t("AVAILABILITY STATUS")}</th>
                  <th>{t("COMPLETED DELIVERIES")}</th>
                  <th>{t("SATISFACTION RATE")}</th>
                  <th style={{ textAlign: 'center' }}>{t("ACTIONS")}</th>
                </tr>
              </thead>
              <tbody>
                {(data.volunteers || []).map((volunteer) => {
                  const rating = volunteer.profile?.rating || '5.0';
                  const vehicle = volunteer.profile?.vehicleType || t('Standard Vehicle');
                  const status = volunteer.profile?.availability || t('Active');
                  const completedCount = volunteer.profile?.monthlyGoalKg ? Math.round(volunteer.profile.monthlyGoalKg / 5) : 12;
                  const avatar = volunteer.profile?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80";

                  return (
                    <tr key={volunteer._id}>
                      <td>
                        <div className="courier-info-cell">
                          <img 
                            src={avatar} 
                            alt={volunteer.name} 
                            className="courier-avatar" 
                          />
                          <div>
                            <strong className="driver-name">{volunteer.name}</strong>
                            <div className="route-sub" style={{ marginTop: '2px' }}>{volunteer.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="vehicle-info-cell">
                          <Truck size={14} style={{ color: '#7b818a' }} />
                          <span>{vehicle}</span>
                        </div>
                      </td>
                      <td>
                        <span className="overlay-badge perishable" style={{ fontSize: '12px', padding: '4px 10px' }}>
                          {status}
                        </span>
                      </td>
                      <td>
                        <span className="weight-val">{completedCount}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '800', color: '#22252a' }}>
                          <Star size={14} fill="#e2973c" stroke="#e2973c" />
                          <span>{rating}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <a href={`mailto:${volunteer.email}`} className="volunteer-action-btn" title={t("Email")}>
                            <Mail size={16} />
                          </a>
                          {volunteer.profile?.phone && (
                            <a href={`tel:${volunteer.profile.phone}`} className="volunteer-action-btn" title={t("Call")}>
                              <Phone size={16} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!data.volunteers?.length && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#7b818a', padding: '20px' }}>
                      {t("No volunteers onboarded yet.")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="completed-deliveries-page" id="completed-deliveries">
        {/* Header Block */}
        <div className="completed-page-header">
          <div className="completed-header-text">
            <h2>{t("Completed Deliveries Log")}</h2>
            <p>{t("Review secure historical receipts, weight measurements, and signed digital handovers.")}</p>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="completed-metrics-row">
          <div className="completed-metric-card">
            <span className="completed-metric-label">{t("APPROVED HANDOVERS")}</span>
            <div className="completed-metric-value-row">
              <CheckCircle2 className="completed-check-icon" size={20} />
              <strong>{claimedDonations.filter(d => d.status === 'delivered').length || 1} {t("Runs")}</strong>
            </div>
          </div>
          <div className="completed-metric-card">
            <span className="completed-metric-label">{t("TONNAGE CLEARED")}</span>
            <div className="completed-metric-value-row">
              <strong>
                {claimedDonations.filter(d => d.status === 'delivered').length 
                  ? (claimedDonations.filter(d => d.status === 'delivered').reduce((sum, d) => {
                      const qtyMatch = d.quantity?.match(/[\d.]+/);
                      return sum + (qtyMatch ? parseFloat(qtyMatch[0]) : 0);
                    }, 0) / 1000).toFixed(2)
                  : "4.25"} {t("Tons")}
              </strong>
            </div>
          </div>
          <div className="completed-metric-card">
            <span className="completed-metric-label">{t("AVERAGE DISPATCH TIME")}</span>
            <div className="completed-metric-value-row">
              <strong>32.5 {t("Minutes")}</strong>
            </div>
          </div>
        </div>

        {/* Digital Audit Trails Table Panel */}
        <div className="completed-table-panel">
          <div className="completed-table-header">
            <h3>
              <CheckCircle2 className="completed-check-icon-small" size={16} />
              {t("Digital Audit Trails")}
            </h3>
            <button className="btn-outline-grey" style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={14} style={{ transform: 'rotate(45deg)' }} /> {t("Export CSV")}
            </button>
          </div>

          <div className="completed-table-wrapper">
            <table className="completed-table">
              <thead>
                <tr>
                  <th>{t("DELIVERY ROUTE")}</th>
                  <th>{t("ASSIGNED DRIVER")}</th>
                  <th>{t("CARGO CLASS")}</th>
                  <th>{t("NET WEIGHT")}</th>
                  <th>{t("TIMESTAMP")}</th>
                  <th>{t("RECEIPT LINK")}</th>
                </tr>
              </thead>
              <tbody>
                {claimedDonations.filter(d => d.status === 'delivered').map((donation, idx) => (
                  <tr key={donation._id || idx}>
                    <td>
                      <div className="route-main">{donation.title}</div>
                      <div className="route-sub">{donation.pickupAddress || t("Westside Community Center")}</div>
                    </td>
                    <td><span className="driver-name">{donation.assignedVolunteer?.name || 'Sarah Jenkins'}</span></td>
                    <td><span className="cargo-badge">{donation.foodType?.toUpperCase() || 'TEXTILES'}</span></td>
                    <td><span className="weight-val">{donation.quantity}</span></td>
                    <td><span className="time-val">{getPickupTimeStr(donation.updatedAt || donation.pickupWindowStart)}</span></td>
                    <td><a href="#reports" className="receipt-link">{t("Receipt.pdf")}</a></td>
                  </tr>
                ))}
                {!claimedDonations.filter(d => d.status === 'delivered').length && (
                  <tr>
                    <td>
                      <div className="route-main">{t("Textile Donation - Westside Community")}</div>
                      <div className="route-sub">{t("Westside Community Center")}</div>
                    </td>
                    <td><span className="driver-name">{t("Sarah Jenkins")}</span></td>
                    <td><span className="cargo-badge">{t("TEXTILES")}</span></td>
                    <td><span className="weight-val">45 kg</span></td>
                    <td><span className="time-val">08:00 AM</span></td>
                    <td><a href="#reports" className="receipt-link">{t("Receipt.pdf")}</a></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="ngo-panel" id="beneficiaries" style={{ display: 'none' }}>
        {/* hidden beneficiaries */}
      </section>

      <section className="ngo-dashboard-grid">
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

      <section className="ngo-reports-page" id="reports">
        {/* Top metrics row */}
        <div className="reports-top-row">
          {/* Card 1: Cumulative Impact (2x wide) */}
          <div className="reports-impact-card">
            <span className="impact-kicker">{t("CUMULATIVE IMPACT")}</span>
            <h2>{t("1.2M+ Lives Touched")}</h2>
            <div className="impact-footer">
              <button className="btn-generate-report">
                <Download size={15} />
                {t("Generate Report")}
              </button>
              <span className="impact-efficiency"><strong>84%</strong> {t("Target efficiency met")}</span>
            </div>
          </div>

          {/* Card 2: Food Waste Saved */}
          <div className="reports-metric-card">
            <div className="metric-icon-wrapper icon-green">
              <Leaf size={18} />
            </div>
            <span className="metric-kicker">{t("FOOD WASTE SAVED")}</span>
            <h3>{t("42.5 Tons")}</h3>
            <span className="metric-trend text-green">↑ 12% {t("vs last quarter")}</span>
          </div>

          {/* Card 3: Meals Distributed */}
          <div className="reports-metric-card">
            <div className="metric-icon-wrapper icon-beige">
              <Utensils size={18} />
            </div>
            <span className="metric-kicker">{t("MEALS DISTRIBUTED")}</span>
            <h3>{t("850,000")}</h3>
            <span className="metric-trend text-green">↑ 8% {t("vs last month")}</span>
          </div>
        </div>

        {/* Bottom charts row */}
        <div className="reports-charts-row">
          {/* Left Panel: Food Distribution Over Time */}
          <div className="reports-chart-panel panel-left">
            <div className="panel-header-row">
              <div>
                <h3>{t("Food Distribution Over Time")}</h3>
                <p>{t("Monthly performance tonnage tracking for 2026")}</p>
              </div>
              <select className="filter-select" style={{ padding: '6px 12px', fontSize: '13px' }} defaultValue="6">
                <option value="6">{t("Last 6 Months")}</option>
                <option value="12">{t("Last 12 Months")}</option>
              </select>
            </div>
            
            {/* SVG Chart */}
            <div className="reports-svg-container">
              <svg viewBox="0 0 600 200" style={{ width: '100%', height: '100%', display: 'block' }}>
                <defs>
                  <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e2973c" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#e2973c" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Horizontal Grid lines */}
                <line x1="0" y1="30" x2="600" y2="30" stroke="#f3ece6" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="80" x2="600" y2="80" stroke="#f3ece6" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="130" x2="600" y2="130" stroke="#f3ece6" strokeWidth="1" strokeDasharray="3 3" />
                
                {/* Gradient Fill under path */}
                <path d="M 0 130 C 50 110, 100 120, 150 70 C 200 20, 250 90, 300 80 C 350 70, 400 40, 450 30 C 500 20, 550 50, 600 40 L 600 180 L 0 180 Z" fill="url(#chart-grad)" />
                
                {/* Main line path */}
                <path d="M 0 130 C 50 110, 100 120, 150 70 C 200 20, 250 90, 300 80 C 350 70, 400 40, 450 30 C 500 20, 550 50, 600 40" fill="none" stroke="#83531b" strokeWidth="3" strokeLinecap="round" />
                
                {/* Critical Dots */}
                <circle cx="150" cy="70" r="4.5" fill="#83531b" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="300" cy="80" r="4.5" fill="#83531b" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="450" cy="30" r="4.5" fill="#83531b" stroke="#ffffff" strokeWidth="1.5" />
              </svg>
            </div>
            
            {/* Chart X Labels */}
            <div className="reports-chart-labels">
              <span>{t("JAN")}</span>
              <span>{t("FEB")}</span>
              <span>{t("MAR")}</span>
              <span>{t("APR")}</span>
              <span>{t("MAY")}</span>
              <span>{t("JUN")}</span>
            </div>
          </div>

          {/* Right Panel: Reduction in Wastage */}
          <div className="reports-chart-panel panel-right">
            <div className="panel-header-row" style={{ marginBottom: '10px' }}>
              <h3>{t("Reduction in Wastage")}</h3>
            </div>

            {/* Circular Progress Container */}
            <div className="donut-chart-container">
              <div className="donut-svg-wrapper">
                <svg viewBox="0 0 160 160" style={{ width: '150px', height: '150px' }}>
                  <circle cx="80" cy="80" r="60" stroke="#f0ede9" strokeWidth="12" fill="none" />
                  <circle cx="80" cy="80" r="60" stroke="#78be21" strokeWidth="12" fill="none"
                    strokeDasharray="377" strokeDashoffset="105.5" strokeLinecap="round" transform="rotate(-90 80 80)" />
                </svg>
                <div className="donut-center-text">
                  <strong>{t("72%")}</strong>
                  <span>{t("REDUCTION")}</span>
                </div>
              </div>
            </div>

            {/* Bottom details row */}
            <div className="donut-stats-row">
              <div className="donut-stat-col">
                <strong>15.2t</strong>
                <span>{t("DIRECT SAVE")}</span>
              </div>
              <div className="donut-stat-divider" />
              <div className="donut-stat-col">
                <strong>4.1t</strong>
                <span>{t("OPTIMIZED")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Third Row: Regional Growth and Global Map */}
        <div className="reports-charts-row" style={{ flexShrink: 0 }}>
          {/* Left Panel: Regional Beneficiary Growth */}
          <div className="reports-chart-panel panel-left" style={{ height: 'auto' }}>
            <div className="panel-header-row" style={{ marginBottom: '18px' }}>
              <h3>{t("Regional Beneficiary Growth")}</h3>
              <a href="#beneficiaries" className="sched-routes-link" style={{ fontSize: '13.5px' }}>{t("View All")} &rarr;</a>
            </div>
            <div className="completed-table-wrapper" style={{ overflow: 'visible' }}>
              <table className="completed-table">
                <thead>
                  <tr>
                    <th>{t("DISTRICT")}</th>
                    <th>{t("PEOPLE FED")}</th>
                    <th>{t("GROWTH")}</th>
                    <th>{t("STATUS")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong style={{ color: '#22252a', fontSize: '14px' }}>{t("Central District")}</strong></td>
                    <td><span className="weight-val">124,500</span></td>
                    <td><span className="metric-trend text-green">+18.2%</span></td>
                    <td><span className="overlay-badge perishable" style={{ fontSize: '10px', padding: '3px 8px' }}>{t("ACTIVE")}</span></td>
                  </tr>
                  <tr>
                    <td><strong style={{ color: '#22252a', fontSize: '14px' }}>{t("South-East Zone")}</strong></td>
                    <td><span className="weight-val">98,200</span></td>
                    <td><span className="metric-trend text-green">+5.4%</span></td>
                    <td><span className="overlay-badge perishable" style={{ fontSize: '10px', padding: '3px 8px' }}>{t("ACTIVE")}</span></td>
                  </tr>
                  <tr>
                    <td><strong style={{ color: '#22252a', fontSize: '14px' }}>{t("North-West Metro")}</strong></td>
                    <td><span className="weight-val">215,000</span></td>
                    <td><span className="metric-trend" style={{ color: '#c02b0a', fontWeight: '600' }}>-2.1%</span></td>
                    <td><span className="overlay-badge non-perishable" style={{ backgroundColor: '#fff0ee', color: '#c02b0a', fontSize: '10px', padding: '3px 8px' }}>{t("REVIEW")}</span></td>
                  </tr>
                  <tr>
                    <td><strong style={{ color: '#22252a', fontSize: '14px' }}>{t("Harbor Heights")}</strong></td>
                    <td><span className="weight-val">45,100</span></td>
                    <td><span className="metric-trend text-green">+24.0%</span></td>
                    <td><span className="overlay-badge" style={{ backgroundColor: '#f9f6f3', color: '#83531b', fontSize: '10px', padding: '3px 8px', fontWeight: '800' }}>{t("EXPANDING")}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Panel: Global Outreach Map */}
          <div className="reports-chart-panel panel-right" style={{ padding: '0', overflow: 'hidden', height: '320px', position: 'relative' }}>
            <div style={{
              position: 'absolute',
              top: '18px',
              left: '18px',
              zIndex: '10',
              background: '#ffffff',
              border: '1px solid #ebdcd0',
              borderRadius: '14px',
              padding: '12px 18px',
              boxShadow: '0 4px 12px rgba(45,38,30,0.08)',
              maxWidth: '280px'
            }}>
              <h4 style={{ margin: '0 0 3px 0', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '800', color: '#22252a' }}>
                <Globe size={14} style={{ color: '#83531b' }} />
                {t("Global Outreach Map")}
              </h4>
              <p style={{ margin: '0', fontSize: '11px', color: '#7b818a', fontWeight: '500' }}>
                {t("Real-time heat signature of NGO impact zones")}
              </p>
            </div>
            <iframe
              title="Global Outreach Map"
              src="https://maps.google.com/maps?q=London,UK&t=k&z=12&output=embed"
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            />
          </div>
        </div>

        {/* Bottom Sync and Action Bar */}
        <div style={{
          flexShrink: 0,
          background: '#f9f6f3',
          border: '1px solid #ebdcd0',
          borderRadius: '16px',
          padding: '18px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <span style={{ fontSize: '13.5px', color: '#7b818a', fontWeight: '500' }}>
            {t("Last sync: 12 mins ago")} &nbsp;|&nbsp; {t("Data source: Global Relief ERP")}
          </span>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-outline-grey" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '9px 18px' }}>
              <Download size={13} />
              {t("Export CSV")}
            </button>
            <button className="btn-outline-grey" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '9px 18px' }}>
              <Download size={13} />
              {t("Export PDF")}
            </button>
            <button className="btn-solid-gold" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '9px 20px', backgroundColor: '#2c2f35', borderColor: '#2c2f35' }}>
              <Mail size={13} />
              {t("Share via Email")}
            </button>
          </div>
        </div>
      </section>

      <section className="ngo-panel ngo-map-panel">
        <div>
          <p className="dashboard-kicker">{t("Google Maps Integration")}</p>
          <h2>{t("Pickup location map")}</h2>
        </div>
        <div className="ngo-map">
          {selectedDonation?.pickupAddress && selectedDonation?.status !== 'posted' ? (
            <iframe
              title="Donation pickup map"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(`${selectedDonation.pickupAddress} ${selectedDonation.city}`)}&output=embed`}
            />
          ) : selectedDonation?.status === 'posted' ? (
            <div className="sched-mini-map-placeholder" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
              <Lock size={32} />
              <span>{t("Claim this donation to view the pickup route map.")}</span>
            </div>
          ) : (
            <><MapPin /><span>{t("Select a donation to preview pickup location.")}</span></>
          )}
        </div>
      </section>

      <section className="messages-inbox-page" id="notifications">
        <div className="messages-layout">
          <div className="chats-sidebar">
            <div className="chats-sidebar-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} />
                <div>
                  <h3 style={{ margin: '0', fontWeight: '800', color: '#22252a' }}>{t("Volunteer Messenger")}</h3>
                  <p style={{ margin: '2px 0 0 0', color: '#7b818a', fontWeight: '500' }}>{t("Direct NGO-Volunteer Chat")}</p>
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
                      <span className="chat-status" style={{ fontSize: '11px', textTransform: 'uppercase' }}>{t(contact.role || 'volunteer')}</span>
                    </div>
                    {contact.phone && <p className="chat-preview" style={{ fontSize: '11px' }}>{contact.phone}</p>}
                  </div>
                </div>
              ))}
              {!chatContacts.length && <p style={{ padding: '16px', color: '#7b818a' }}>{t('No active volunteer chats yet.')}</p>}
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
                      <span className="header-status-label" style={{ background: '#ebf8ff', color: '#2b6cb0' }}>{t("Live Messaging")}</span>
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
                  {!chatMessages.length && <p style={{ textAlign: 'center', color: '#a0aec0', padding: '20px' }}>{t('Send a message to start the conversation.')}</p>}
                </div>
                <form onSubmit={handleSendMessage} style={{ display: 'flex', padding: '16px', background: '#fff', borderTop: '1px solid #edf2f7' }}>
                  <input type="text" value={newMessageText} onChange={(e) => setNewMessageText(e.target.value)} placeholder={t("Type a message...")} style={{ flex: 1, padding: '12px 16px', borderRadius: '24px', border: '1px solid #cbd5e0', outline: 'none', fontSize: '14px' }} />
                  <button type="submit" className="button button-primary" style={{ marginLeft: '12px', borderRadius: '50%', width: '42px', height: '42px', minHeight: '42px', padding: '0', display: 'grid', placeItems: 'center', background: '#83531b', boxShadow: 'none' }}><Send size={16} /></button>
                </form>
              </>
            ) : (
              <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#a0aec0', textAlign: 'center' }}>
                <div><MessageSquare size={48} style={{ margin: '0 auto 12px' }} /><p>{t('Select a contact from the sidebar to chat.')}</p></div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="ngo-settings-page" id="settings">
        {/* Header Block */}
        <div className="settings-header-row">
          <div className="settings-header-text">
            <h2>{t("System Settings")}</h2>
            <p>{t("Adjust secure satellite communications, auto-routing algorithm priorities, and satellite node profiles.")}</p>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="settings-layout-grid">
          {/* Left Column (2/3 width) */}
          <div className="settings-col-left">
            {/* Card 1: Coordinator Profile Settings */}
            <div className="settings-section-card">
              <div className="settings-card-header">
                <Sliders size={18} style={{ color: '#83531b' }} />
                <h3>{t("Coordinator Profile Settings")}</h3>
              </div>
              
              <div className="settings-inputs-grid">
                <div className="settings-input-group">
                  <label>{t("System Name")}</label>
                  <input type="text" defaultValue="Sarah Mitchell" readOnly />
                </div>
                <div className="settings-input-group">
                  <label>{t("Coordinator Email")}</label>
                  <input type="text" defaultValue="s.mitchell@reliefshare.org" readOnly />
                </div>
                <div className="settings-input-group">
                  <label>{t("Primary Logistics Hub")}</label>
                  <input type="text" defaultValue="North District Hub - San Francisco" readOnly />
                </div>
                <div className="settings-input-group">
                  <label>{t("Assigned Duty Shift")}</label>
                  <input type="text" defaultValue="Day Shift Logistics Coordinator" readOnly />
                </div>
              </div>
            </div>

            {/* Card 2: Auto-Routing Engine Preferences */}
            <div className="settings-section-card" style={{ marginTop: '24px' }}>
              <div className="settings-card-header">
                <Sliders size={18} style={{ color: '#83531b' }} />
                <h3>{t("Auto-Routing Engine Preferences")}</h3>
              </div>

              <div className="settings-toggles-list">
                <div className="settings-toggle-row">
                  <div>
                    <strong>{t("Auto-Dispatch Driver Assignment")}</strong>
                    <p>{t("Automatically matches certified unassigned volunteers to scheduled pickup routes using live distance metrics.")}</p>
                  </div>
                  <label className="settings-switch-toggle">
                    <input type="checkbox" defaultChecked />
                    <span className="slider-round"></span>
                  </label>
                </div>

                <div className="settings-toggle-row" style={{ borderTop: '1.5px solid #f2ede8', paddingTop: '18px', marginTop: '18px' }}>
                  <div>
                    <strong>{t("Satellite Despatch Notifications")}</strong>
                    <p>{t("Enables browser desktop push notifications for unassigned urgent donation alerts and volunteer route status updates.")}</p>
                  </div>
                  <label className="settings-switch-toggle">
                    <input type="checkbox" defaultChecked />
                    <span className="slider-round"></span>
                  </label>
                </div>

                <div className="settings-select-group" style={{ borderTop: '1.5px solid #f2ede8', paddingTop: '18px', marginTop: '18px' }}>
                  <strong>{t("Backup Interval Frequency (mins)")}</strong>
                  <div style={{ marginTop: '8px', maxWidth: '320px' }}>
                    <select className="chat-text-input" style={{ width: '100%', height: '42px', appearance: 'auto', background: '#f9f6f3' }}>
                      <option>{t("Every 15 minutes")}</option>
                      <option>{t("Every 30 minutes")}</option>
                      <option>{t("Every hour")}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (1/3 width) */}
          <div className="settings-col-right">
            {/* Card 3: Satellite Core Node */}
            <div className="settings-section-card">
              <div className="settings-card-header">
                <Shield size={18} style={{ color: '#83531b' }} />
                <h3>{t("Satellite Core Node")}</h3>
              </div>
              <p style={{ margin: '8px 0 16px 0', fontSize: '13.5px', color: '#7b818a', lineHeight: '1.4', fontWeight: '500' }}>
                {t("ReliefShare is protected by dynamic end-to-end TLS encryption. All logistics updates are securely routed.")}
              </p>
              
              <table className="settings-stats-table">
                <tbody>
                  <tr>
                    <td>{t("Node Status")}</td>
                    <td style={{ textAlign: 'right', color: '#78be21', fontWeight: '800' }}>● {t("Online")}</td>
                  </tr>
                  <tr>
                    <td>{t("Latency")}</td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: '#22252a' }}>14 ms</td>
                  </tr>
                  <tr>
                    <td>{t("System Version")}</td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: '#22252a' }}>v2.4.1</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Card 4: Data Sync Status */}
            <div className="settings-section-card" style={{ marginTop: '24px' }}>
              <div className="settings-card-header">
                <Database size={18} style={{ color: '#83531b' }} />
                <h3>{t("Data Sync Status")}</h3>
              </div>
              <p style={{ margin: '8px 0 16px 0', fontSize: '13.5px', color: '#7b818a', lineHeight: '1.4', fontWeight: '500' }}>
                {t("Logistics records are synchronized with our centralized Global Relief ERP servers.")}
              </p>
              
              <button className="btn-sync-database">
                <RefreshCw size={13} style={{ marginRight: '6px' }} />
                {t("Sync Database Manual")}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="ngo-support-page" id="support">
        {/* Header */}
        <div className="support-header-row">
          <div className="support-header-text">
            <h2>{t("Help & Support")}</h2>
            <p>{t("Need help managing donations, volunteers, or pickups? Our support team is here for you 24/7.")}</p>
          </div>
        </div>

        {/* Main card */}
        <div className="support-main-card">

          {/* FAQ Section */}
          <div className="support-faq-section">
            <h3 className="support-section-title">{t("Frequently Asked Questions")}</h3>

            <SupportFAQ
              question={t("How do I claim a food donation for my NGO?")}
              answer={t("Go to the 'Available Donations' tab to browse open listings from donors nearby. Click 'Claim Donation' on any listing and assign a volunteer courier for pickup. Once claimed, the donor is notified and a pickup is scheduled automatically.")}
            />
            <SupportFAQ
              question={t("How do I manage my volunteer logistics crew?")}
              answer={t("Visit the 'Volunteer Management' tab to view all active couriers, their vehicle details, current status, and delivery ratings. You can onboard new volunteers, contact them directly, or remove them from your crew at any time.")}
            />
            <SupportFAQ
              question={t("How do I record and verify beneficiary distributions?")}
              answer={t("After a delivery is completed, head to the 'Completed Deliveries' tab. Each record shows the food type, quantity delivered, beneficiary location, and volunteer who completed the handoff. These records are used to generate your impact reports.")}
            />
            <SupportFAQ
              question={t("What should I do if a donor cancels after we've claimed a donation?")}
              answer={t("If a donor cancels a claimed donation, you will receive an in-app notification and an email alert immediately. Go to 'Scheduled Pickups' to see the updated status. Contact our support team via the form below if you need urgent reassignment or have a beneficiary group waiting.")}
            />
          </div>

          {/* Divider */}
          <div className="support-divider" />

          {/* Message Support Team */}
          <div className="support-contact-section">
            <h3 className="support-section-title">
              <MessageSquare size={18} />
              {t("Message Support Team")}
            </h3>
            <textarea
              className="support-textarea"
              placeholder={t("Describe your issue — e.g. a donation wasn't picked up, a volunteer didn't arrive, or an account access problem…")}
              rows={5}
            />
            <button className="btn-support-submit" type="button">
              <Send size={15} />
              {t("Submit Message")}
            </button>
          </div>
        </div>
      </section>

      <section className="ngo-dashboard-grid">
        <article className="ngo-panel" id="profile">
          <div className="panel-heading"><div><p className="dashboard-kicker">{t("Profile")}</p><h2>{t("NGO partner details")}</h2></div></div>
          <div className="profile-detail-grid">
            <div><UsersRound size={18} /><span>{t("Organization")}</span><strong>{user?.name}</strong></div>
            <div><MapPin size={18} /><span>{t("Service Area")}</span><strong>{user?.profile?.serviceArea || user?.profile?.city || t('Service area not set')}</strong></div>
            <div><CheckCircle2 size={18} /><span>{t("Verification")}</span><strong>{titleCase(user?.profile?.verificationStatus || 'pending')}</strong></div>
            <div><Soup size={18} /><span>{t("Distribution Focus")}</span><strong>{titleCase(deliveryTarget)}</strong></div>
          </div>
        </article>
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
