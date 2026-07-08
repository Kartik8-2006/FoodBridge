import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, Award, Bell, CheckCircle2, ChevronDown, ChevronUp, Clock, Edit2, Eye, EyeOff, Globe, Heart, HeartHandshake, HeartPulse, HelpCircle, ImagePlus, Info, Languages, Leaf, Lock, Mail, MapPin, MessageSquare, Navigation, Package, Phone, Plus, Save, Send, Shield, ShieldCheck, ShoppingCart, Star, ClipboardList, Trash2, Truck, Upload, UploadCloud, User, UserCheck, UserX, Users, Utensils, X } from 'lucide-react';
import { api } from '../../api.js';
import TrackingMap from '../../components/TrackingMap.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
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

const categories = [
  { id: 'cooked', label: 'Cooked Meals' },
  { id: 'produce', label: 'Fresh Produce' },
  { id: 'bakery', label: 'Bakery & Bread' },
  { id: 'packaged', label: 'Pantry/Canned' },
];

const dietaryLabelsList = [
  'Vegan',
  'Vegetarian',
  'Gluten Free',
  'Dairy Free',
  'Halal',
  'Kosher',
  'Nut Free'
];

function formatDateTimeLocal(date) {
  const pad = (num) => String(num).padStart(2, '0');
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
}

const initialForm = {
  title: '',
  quantity: '',
  pickupAddress: '',
  city: '',
  contactNumber: '',
  storageInstructions: '',
  allergenNotes: '',
  imageUrl: ''
};

export default function DonorDashboard() {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { data, error, refresh } = useDashboardData();
  const [form, setForm] = useState(initialForm);
  const [selectedDonationId, setSelectedDonationId] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [trendMode, setTrendMode] = useState('weekly');
  const [impactOpen, setImpactOpen] = useState(false);

  // New layout states
  const [selectedCategory, setSelectedCategory] = useState('cooked');
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [expiresInHours, setExpiresInHours] = useState(4);
  const [pickupTime, setPickupTime] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [historyPage, setHistoryPage] = useState(1);
  const [notificationsList, setNotificationsList] = useState([]);
  const [chatContacts, setChatContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');

  const handleMarkAllRead = async () => {
    try {
      await api('/notifications/read-all', { method: 'PATCH' });
      setNotificationsList(prev => prev.map(item => ({ ...item, unread: false, readAt: item.readAt || new Date().toISOString() })));
    } catch (err) {
      setFormMessage(err.message);
    }
  };

  const handleNotificationAction = (item, btn) => {
    if (btn.action === 'track') {
      const element = document.getElementById('track-donations');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        alert(t('Tracking delivery details...'));
      }
    } else if (btn.action === 'details') {
      alert(t('Loading donation details...'));
    } else if (btn.action === 'respond') {
      const element = document.getElementById('donate-food');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        alert(t('Opening food donation response form...'));
      }
    }
  };

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.profile?.phone || '',
    accountType: user?.profile?.foodSourceType || '',
    address: user?.profile?.address || ''
  });
  const [profileNotice, setProfileNotice] = useState('');

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
            foodSourceType: profileForm.accountType,
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

  async function fetchContacts() {
    try {
      const res = await api('/messages/contacts');
      setChatContacts(res.contacts || []);
      if (res.contacts?.length && !selectedContact) setSelectedContact(res.contacts[0]);
    } catch (err) {
      setFormMessage(err.message || 'Failed to load chat contacts');
    }
  }

  async function fetchChatMessages(contactId) {
    if (!contactId) return;
    try {
      const res = await api(`/messages/thread/${contactId}`);
      setChatMessages(res.messages || []);
    } catch (err) {
      setFormMessage(err.message || 'Failed to load messages');
    }
  }

  async function handleSendMessage(event) {
    event.preventDefault();
    if (!newMessageText.trim() || !selectedContact) return;
    const text = newMessageText.trim();
    setNewMessageText('');
    try {
      await api('/messages', {
        method: 'POST',
        body: JSON.stringify({ recipientId: selectedContact._id, text })
      });
      fetchChatMessages(selectedContact._id);
    } catch (err) {
      setFormMessage(err.message || 'Failed to send message');
    }
  }

  const donations = data?.donations || [];
  const stats = data?.stats || {};
  const selectedDonation = donations.find((item) => item._id === selectedDonationId) || donations[0];

  const activeDonations = donations.filter((item) => ['posted', 'accepted', 'pickup_scheduled', 'picked_up'].includes(item.status));
  const donationHistory = donations.filter((item) => ['delivered', 'cancelled', 'expired'].includes(item.status));
  const totalMeals = Number(stats.mealsContributed ?? donations.reduce((sum, item) => sum + Number(item.estimatedMeals || 0), 0));
  const foodSavedKg = Number(stats.foodSavedKg ?? donations.reduce((sum, item) => sum + getDonationKg(item), 0));
  const trendData = useMemo(() => buildDonationTrend(donations, trendMode), [donations, trendMode]);
  const categoryDistribution = useMemo(() => {
    const buckets = [
      ['Perishables', (item) => !['packaged', 'bakery'].includes(item.foodType)],
      ['Packed / Canned', (item) => item.foodType === 'packaged'],
      ['Bakery / Bread', (item) => item.foodType === 'bakery']
    ];
    const total = Math.max(1, donations.length);
    return buckets.map(([label, matches]) => ({
      label,
      percent: Math.round((donations.filter(matches).length / total) * 100)
    }));
  }, [donations]);
  const pickupMapQuery = form.pickupAddress
    ? `${form.pickupAddress}, ${form.city || user?.profile?.city || ''}`.trim()
    : '';
  const pickupMapSrc = pickupMapQuery
    ? `https://maps.google.com/maps?q=${encodeURIComponent(pickupMapQuery)}&z=14&output=embed`
    : '';
  const liveVolunteerCoords = selectedDonation?.volunteerLocation &&
    Number.isFinite(Number(selectedDonation.volunteerLocation.latitude)) &&
    Number.isFinite(Number(selectedDonation.volunteerLocation.longitude))
    ? `${selectedDonation.volunteerLocation.latitude},${selectedDonation.volunteerLocation.longitude}`
    : '';
  const pickupCoords = selectedDonation?.pickupLocation &&
    Number.isFinite(Number(selectedDonation.pickupLocation.latitude)) &&
    Number.isFinite(Number(selectedDonation.pickupLocation.longitude))
    ? `${selectedDonation.pickupLocation.latitude},${selectedDonation.pickupLocation.longitude}`
    : '';
  const trackMapQuery = liveVolunteerCoords || pickupCoords || (selectedDonation?.pickupAddress ? `${selectedDonation.pickupAddress}, ${selectedDonation.city || ''}`.trim() : '');
  const trackMapSrc = trackMapQuery ? `https://maps.google.com/maps?q=${encodeURIComponent(trackMapQuery)}&z=${liveVolunteerCoords ? 16 : 15}&output=embed` : '';

  useEffect(() => {
    if (user) {
      setForm((current) => ({
        ...current,
        pickupAddress: current.pickupAddress || user.profile?.address || '',
        city: current.city || user.profile?.city || '',
        contactNumber: current.contactNumber || user.profile?.phone || user.phone || ''
      }));
    }
  }, [user]);

  useEffect(() => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    setNotificationsList((data?.notifications || []).map((item) => {
      const createdDate = item.createdAt ? new Date(item.createdAt) : null;
      const createdDay = createdDate?.toDateString();
      return {
        ...item,
        id: item._id || item.id,
        category: createdDay === today ? 'today' : createdDay === yesterday ? 'yesterday' : 'older',
        time: createdDate ? formatDate(createdDate) : '',
        unread: !item.readAt,
        boldText: item.metadata?.donationTitle || item.donation?.title || '',
        buttons: item.link ? [{ label: 'View', style: 'primary', action: item.link.includes('track') ? 'track' : 'details' }] : []
      };
    }));
  }, [data?.notifications]);

  useEffect(() => {
    fetchContacts();
    const interval = setInterval(fetchContacts, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedContact?._id) {
      fetchChatMessages(selectedContact._id);
      const interval = setInterval(() => fetchChatMessages(selectedContact._id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedContact?._id]);

  useEffect(() => {
    const defaultPickupTime = new Date(Date.now() + 60 * 60 * 1000);
    defaultPickupTime.setMinutes(0, 0, 0);
    setPickupTime(formatDateTimeLocal(defaultPickupTime));
  }, []);

  const quickStats = useMemo(() => {
    const ngosHelped = stats.ngosHelped ?? new Set(donations.map((item) => item.acceptedBy?._id || item.acceptedBy).filter(Boolean)).size;
    const volunteersAssigned = stats.volunteersAssigned ?? donations.filter((item) => item.assignedVolunteer).length;

    return [
      ['Total Donations', donations.length],
      ['Food Saved (kg)', foodSavedKg || t('Pending')],
      ['Meals Provided', totalMeals],
      ['NGOs Helped', ngosHelped],
      ['Volunteers Assigned', volunteersAssigned],
      ['Average Pickup Time', stats.averagePickupTime || t('Pending')]
    ];
  }, [donations, foodSavedKg, stats, totalMeals, t]);

  if (!data) return <main className="dashboard"><p>{t(error) || t('Loading donor dashboard...')}</p></main>;

  function update(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function updateImage(event) {
    const file = event.target.files?.[0];
    readImageFile(file);
  }

  function readImageFile(file) {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormMessage(t('Image is too large. Please upload an image under 5 MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, imageUrl: reader.result }));
    reader.readAsDataURL(file);
  }

  function handleUploadDrop(event) {
    event.preventDefault();
    readImageFile(event.dataTransfer.files?.[0]);
  }

  function resetDonationForm() {
    setForm({
      title: '',
      quantity: '',
      pickupAddress: user?.profile?.address || '',
      city: user?.profile?.city || '',
      contactNumber: user?.profile?.phone || user?.phone || 'Not provided',
      storageInstructions: '',
      allergenNotes: '',
      imageUrl: ''
    });
    setSelectedCategory('cooked');
    setSelectedLabels([]);
    setExpiresInHours(4);
    setFormMessage('');

    const defaultPickupTime = new Date(Date.now() + 60 * 60 * 1000);
    defaultPickupTime.setMinutes(0, 0, 0);
    setPickupTime(formatDateTimeLocal(defaultPickupTime));
  }

  function updateExpiryTime(value) {
    const expiryDate = new Date(value);
    if (Number.isNaN(expiryDate.getTime())) return;
    const hours = Math.max(1, Math.ceil((expiryDate.getTime() - Date.now()) / (60 * 60 * 1000)));
    setExpiresInHours(hours);
  }

  function toggleLabel(label) {
    setSelectedLabels((current) =>
      current.includes(label) ? current.filter((l) => l !== label) : [...current, label]
    );
  }

  async function cancelDonation(id) {
    if (!window.confirm(t('Are you sure you want to cancel this donation?'))) return;
    try {
      await api(`/donations/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled' })
      });
      refresh();
    } catch (err) {
      alert(err.message);
    }
  }

  async function completeDonation(id) {
    try {
      await api(`/donations/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'delivered' })
      });
      refresh();
    } catch (err) {
      alert(err.message);
    }
  }

  function handleTrackLogistics(donation) {
    setSelectedDonationId(donation._id);
    const element = document.getElementById('track-donations');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  async function submitDonation(event) {
    event.preventDefault();
    setFormMessage('');

    const now = new Date();
    const selectedTime = pickupTime ? new Date(pickupTime) : new Date(now.getTime() + 60 * 60 * 1000);
    const pickupWindowStart = selectedTime.toISOString();
    const pickupWindowEnd = new Date(selectedTime.getTime() + 3 * 60 * 60 * 1000).toISOString();

    const safeBefore = new Date(now.getTime() + expiresInHours * 60 * 60 * 1000).toISOString();

    const quantityNum = parseInt(form.quantity.match(/\d+/)?.[0], 10);
    const estimatedMeals = isNaN(quantityNum) ? 20 : quantityNum;

    let dietType = 'mixed';
    if (selectedLabels.includes('Vegan')) {
      dietType = 'vegan';
    } else if (selectedLabels.includes('Vegetarian')) {
      dietType = 'veg';
    } else if (selectedLabels.includes('Halal') || selectedLabels.includes('Kosher')) {
      dietType = 'veg';
    }

    const finalImageUrl = form.imageUrl;

    try {
      await api('/donations', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          foodType: selectedCategory,
          dietType,
          dietaryLabels: selectedLabels,
          estimatedMeals,
          pickupWindowStart,
          pickupWindowEnd,
          safeBefore,
          imageUrl: finalImageUrl,
        })
      });

      setForm({
        title: '',
        quantity: '',
        pickupAddress: user.profile?.address || '',
        city: user.profile?.city || '',
        contactNumber: user.profile?.phone || '',
        storageInstructions: '',
        allergenNotes: '',
        imageUrl: ''
      });
      setSelectedCategory('cooked');
      setSelectedLabels([]);
      setExpiresInHours(4);

      const defaultPickupTime = new Date(Date.now() + 60 * 60 * 1000);
      defaultPickupTime.setMinutes(0, 0, 0);
      setPickupTime(formatDateTimeLocal(defaultPickupTime));

      setFormMessage(t('Donation created. NGOs and volunteers have been notified.'));
      refresh();
    } catch (err) {
      setFormMessage(err.message);
    }
  }

  return (
    <DashboardShell eyebrow="Donor Dashboard" title="Food donation workspace" actions={<a className="button button-primary" href="#donate-food"><Plus size={17} /> {t("Donate Food")}</a>}>
      <section className="donor-home-reference" id="dashboard-home">
        <div className="donor-home-head">
          <div>
            <h2>Donor Dashboard</h2>
            <p>{stats.peopleImpacted ? t('Your completed donations have reached real beneficiaries.') : t('Create and complete donations to build your impact report.')}</p>
          </div>
          <article className="saved-chip">
            <span><Leaf size={24} fill="currentColor" /></span>
            <div><small>TOTAL SAVED</small><strong>{Number(foodSavedKg || 0).toLocaleString()} kg Food</strong></div>
          </article>
        </div>

        <section className="donor-home-top-grid">
          <article className="donor-home-stat">
            <span className="donor-stat-icon warm"><Utensils size={27} /></span>
            <small>TOTAL MEALS DONATED</small>
            <strong>{Number(totalMeals || 0).toLocaleString()}</strong>
            <em>{t('From verified donation records')}</em>
          </article>
          <article className="donor-home-stat">
            <span className="donor-stat-icon neutral"><Package size={27} /></span>
            <small>ACTIVE DONATIONS</small>
            <strong>{activeDonations.length || 4}</strong>
            <p>Pick-up scheduled today</p>
          </article>
          <article className="donor-home-stat">
            <span className="donor-stat-icon neutral"><Users size={27} /></span>
            <small>PEOPLE IMPACTED</small>
            <strong>{Number(stats.peopleImpacted || 0).toLocaleString()}</strong>
            <p>Local community members</p>
          </article>
          <article className="hunger-card">
            <h3>Help clear hunger today</h3>
            <p>You have surplus inventory. Convert it into impact in less than 2 minutes.</p>
            <a href="#donate-food">Donate Food Now <ArrowRight size={18} /></a>
          </article>
        </section>

        <section className="donor-home-main-grid">
          <article className="trend-card">
            <div className="trend-head">
              <h3>Donation Trends</h3>
              <div className="trend-tabs">
                <button className={trendMode === 'weekly' ? 'active' : ''} type="button" onClick={() => setTrendMode('weekly')}>Weekly</button>
                <button className={trendMode === 'monthly' ? 'active' : ''} type="button" onClick={() => setTrendMode('monthly')}>Monthly</button>
              </div>
            </div>
            <div className="trend-plot" style={{ '--max': trendData.max || 1 }}>
              {trendData.items.map((item, index) => (
                <button
                  className={index === trendData.highlightIndex ? 'highlight' : ''}
                  key={item.label}
                  style={{ '--height': `${Math.max(8, Math.round((item.kg / trendData.max) * 100))}%` }}
                  title={`${item.label}: ${item.kg} kg donated`}
                  type="button"
                >
                  <span>{item.kg} kg</span>
                </button>
              ))}
            </div>
            <div className="trend-labels">
              {trendData.items.map((item) => <span key={item.label}>{item.label}</span>)}
            </div>
          </article>

          <article className="recent-card">
            <div className="recent-head"><h3>Recent Activity</h3><a href="#donation-history">View All</a></div>
            <div className="recent-list">
              {donations.slice(0, 3).map((donation) => (
                <ActivityRow
                  key={donation._id}
                  icon={donation.status === 'delivered' ? <CheckCircle2 size={26} /> : <ShoppingCart size={26} />}
                  tone={donation.status === 'delivered' ? 'neutral' : 'warm'}
                  title={donation.title}
                  text={donation.pickupAddress || t('Pickup address unavailable')}
                  tag={titleCase(donation.status)}
                  positive={donation.status === 'delivered'}
                />
              ))}
              {!donations.length && <p>{t('No recent donation activity yet.')}</p>}
            </div>
          </article>
        </section>

        <button className="impact-story-card" type="button" onClick={() => setImpactOpen(true)}>
          <span className="impact-story-placeholder"><Leaf size={40} /></span>
          <span>
            <small>IMPACT STORY</small>
            <strong>{t('Impact report')}</strong>
            <em>{t('Your verified impact report will appear after completed donations are processed by the backend.')}</em>
            <b>Read Full Report <ArrowRight size={17} /></b>
          </span>
        </button>

        {impactOpen && <ImpactStoryModal onClose={() => setImpactOpen(false)} />}
      </section>

      <section className="active-donations-section" id="active-donations">
        <div className="section-header-row">
          <div>
            <h2>{t("Active Donations")}</h2>
            <p>{t("Monitor and manage your active listings, logistics tracking, and volunteer assignments.")}</p>
          </div>
          <a className="btn-add-surplus" href="#donate-food"><Plus size={16} /> {t("Donate Surplus Food")}</a>
        </div>

        <div className="filter-tabs-row">
          {[
            { id: 'all', label: t('All Active') },
            { id: 'pickup', label: t('Waiting for Pickup') },
            { id: 'volunteer', label: t('Volunteer Assigned') },
            { id: 'pending', label: t('Pending Approval') }
          ].map((tab) => (
            <button
              key={tab.id}
              className={`filter-tab ${activeTab === tab.id ? 'active' : ''}`}
              type="button"
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="donation-cards-grid">
          {activeDonations.filter((donation) => {
            if (activeTab === 'pickup') return donation.status === 'accepted';
            if (activeTab === 'volunteer') return ['pickup_scheduled', 'picked_up'].includes(donation.status);
            if (activeTab === 'pending') return donation.status === 'posted';
            return true;
          }).map((donation) => {
            const cardId = `RS-${donation._id.slice(-4).toUpperCase()}`;
            const displayTitle = donation.title.includes(donation.quantity)
              ? donation.title
              : `${donation.title} (${donation.quantity})`;

            let badgeClass = 'pending';
            let badgeText = t('Pending Approval');
            if (donation.status === 'accepted') {
              badgeClass = 'pickup';
              badgeText = t('Waiting for Pickup');
            } else if (donation.status === 'pickup_scheduled') {
              badgeClass = 'assigned';
              badgeText = t('Volunteer Assigned');
            } else if (donation.status === 'picked_up') {
              badgeClass = 'transit';
              badgeText = t('In Transit');
            }

            const displayImage = donation.imageUrl || '';

            return (
              <article className="donation-card-premium" key={donation._id}>
                <div className="card-image-wrapper">
                  <span className={`card-badge ${badgeClass}`}>{badgeText}</span>
                  {displayImage ? <img src={displayImage} alt={donation.title} /> : <div className="pickup-placeholder"><Package /></div>}
                </div>

                <div className="card-content-premium">
                  <span className="card-id-premium">{t("ID: ")}{cardId}</span>
                  <h3 className="card-title-premium">{displayTitle}</h3>

                  <div className="card-details-list">
                    <div className="card-detail-item">
                      <Clock size={16} />
                      <span><strong>{t("Pickup Window:")}</strong> {new Date(donation.pickupWindowStart).toISOString().slice(0, 16).replace('T', ' ')}</span>
                    </div>
                    <div className="card-detail-item">
                      <MapPin size={16} />
                      <span><strong>{t("Location:")}</strong> {donation.pickupAddress}</span>
                    </div>
                    <div className="card-detail-item labels">
                      <ShieldCheck size={16} />
                      <span><strong>{t("Labels:")}</strong> {donation.dietaryLabels?.length ? donation.dietaryLabels.join(' & ') + ' options' : t('None')}</span>
                    </div>
                  </div>

                  {donation.storageInstructions && (
                    <div className="card-notes-box">
                      "{donation.storageInstructions}"
                    </div>
                  )}

                  {donation.assignedVolunteer && (
                    <div className="logistics-partner-bar">
                      <div className="partner-icon-circle">
                        {donation.assignedVolunteer.name?.[0]?.toUpperCase() || 'V'}
                      </div>
                      <div className="partner-info-text">
                        <span>{t("LOGISTICS PARTNER")}</span>
                        <strong>{donation.assignedVolunteer.name}</strong>
                      </div>
                    </div>
                  )}

                  <div className="card-actions-premium">
                    <button className="btn-delete-trash" type="button" onClick={() => cancelDonation(donation._id)} title={t("Cancel Donation")}>
                      <Trash2 size={18} />
                    </button>

                    <div className="card-action-buttons-right">
                      {['pickup_scheduled', 'picked_up'].includes(donation.status) ? (
                        <>
                          <button className="btn-details-outline" type="button" onClick={() => setSelectedDonationId(donation._id)}>{t("Details")}</button>
                          <button className="btn-track-logistics" type="button" onClick={() => handleTrackLogistics(donation)}>
                            <Navigation size={14} /> {t("Track Logistics")}
                          </button>
                          <button className="btn-complete-green" type="button" onClick={() => completeDonation(donation._id)}>
                            <CheckCircle2 size={14} /> {t("Complete")}
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="btn-details-outline" type="button" onClick={() => setSelectedDonationId(donation._id)}>{t("Details")}</button>
                          <button className="btn-complete-green" type="button" onClick={() => completeDonation(donation._id)}>
                            <CheckCircle2 size={14} /> {t("Complete")}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
          {!activeDonations.length && (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: '#667085' }}>
              {t("No active donations yet. Create one from the Donate Food form.")}
            </p>
          )}
        </div>
      </section>

      {/* Live tracking map card */}
      <section className="donor-track-reference" id="track-donations">
        <div className="donor-track-head">
          <div>
            <h2>{t("Track Donations")}</h2>
            <p>{selectedDonation ? `${t("Real-time status of your pickup")} #RS-${selectedDonation._id.slice(-5).toUpperCase()}` : t('Select a donation to track live status')}</p>
          </div>
          <a href={`tel:${selectedDonation?.assignedVolunteer?.profile?.phone || selectedDonation?.assignedVolunteer?.phone || ''}`}>
            <Phone size={21} /> {t("Contact Driver")}
          </a>
        </div>

        <div className="donor-track-layout">
          <div className="donor-track-main">
            <article className="donor-track-map-card">
              <div className="track-eta-chip">
                <Clock size={23} />
                <div>
                  <strong>{liveVolunteerCoords ? t("Live driver location") : t("Tracking unavailable")}</strong>
                  <span>{liveVolunteerCoords ? t("Updated from volunteer tracking") : t("Waiting for volunteer location")}</span>
                </div>
              </div>
              <iframe
                className="track-google-map-frame"
                title="Google Maps live donation tracking"
                src={trackMapSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <footer>
                <div className="track-driver-profile">
                  <User size={32} />
                  <div>
                    <strong>{selectedDonation?.assignedVolunteer?.name || 'David Mitchell'}</strong>
                    <span>{selectedDonation?.assignedVolunteer?.profile?.rating ? `${t('Volunteer Driver')} - ${selectedDonation.assignedVolunteer.profile.rating}` : t('Volunteer Driver')}</span>
                  </div>
                </div>
                <div className="track-map-actions">
                  <button type="button"><MessageSquare size={22} /></button>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trackMapQuery)}`}
                    target="_blank"
                    rel="noreferrer"
                    title={t("Open in Google Maps")}
                  >
                    <Send size={22} />
                  </a>
                </div>
              </footer>
            </article>

            <article className="donor-progress-card">
              <h3>{t("Donation Progress")}</h3>
              <TrackProgress donation={selectedDonation} />
            </article>
          </div>

          <aside className="donor-track-side">
            <article className="donor-pickup-details-card">
              <h3>{t("Pickup Details")}</h3>
              <div className="track-detail-block">
                <small>{t("Pickup From")}</small>
                <strong>{selectedDonation?.donor?.profile?.organizationName || selectedDonation?.donor?.name || t('Donor details unavailable')}</strong>
                <p>{selectedDonation?.pickupAddress || '128 Market St, Suite 4B'}</p>
              </div>
              <div className="track-detail-block">
                <small>{t("Items for Donation")}</small>
                <TrackItems donation={selectedDonation} />
              </div>
              <div className="track-instructions-box">
                <small>{t("Special Instructions")}</small>
                <p>"{selectedDonation?.storageInstructions || 'Please use the rear loading dock entrance. Ring the bell for bakery staff.'}"</p>
              </div>
            </article>

            <article className="donor-social-impact-card">
              <h3>{t("Social Impact")}</h3>
              <p>{t("This donation will provide approximately")}</p>
              <strong>{selectedDonation?.estimatedMeals || 120}</strong>
              <span>{t("Meals for Families")}</span>
              <HeartHandshake size={110} />
            </article>
          </aside>
        </div>
      </section>

      {/* Surplus Food Donation Form */}
      <section className="surplus-food-section" id="donate-food">
        <div className="donate-food-reference-head">
          <h2>{t("Donate Food")}</h2>
          <p>{t("Fill out the details below to share surplus food with those in need. Every meal counts.")}</p>
        </div>

        <div className="donate-food-reference-grid">
          <form className="donate-food-reference-form" onSubmit={submitDonation}>
            <div className="donate-form-two">
              <label>
                <span>{t("Food Type")}</span>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={update}
                  placeholder={t("e.g. Cooked Rice, Sandwich")}
                  required
                />
              </label>
              <label>
                <span>{t("Quantity (kg/servings)")}</span>
                <input
                  type="text"
                  name="quantity"
                  value={form.quantity}
                  onChange={update}
                  placeholder={t("e.g. 5kg or 20 servings")}
                  required
                />
              </label>
            </div>

            <div className="donate-form-two">
              <label>
                <span>{t("Expiry Time")}</span>
                <input
                  type="datetime-local"
                  value={formatDateTimeLocal(new Date(Date.now() + expiresInHours * 60 * 60 * 1000))}
                  onChange={(event) => updateExpiryTime(event.target.value)}
                  required
                />
              </label>
              <label>
                <span>{t("Pickup Time")}</span>
                <input
                  type="datetime-local"
                  value={pickupTime}
                  onChange={(event) => setPickupTime(event.target.value)}
                  required
                />
              </label>
            </div>

            <label className="donate-location-field">
              <span>{t("Pickup Location")}</span>
              <div>
                <MapPin size={20} />
                <input
                  type="text"
                  name="pickupAddress"
                  value={form.pickupAddress}
                  onChange={update}
                  placeholder={t("Enter full address or building name")}
                  required
                />
              </div>
            </label>

            <div className="donate-pickup-map-card">
              {pickupMapSrc ? (
                <iframe
                  title="Pickup location map"
                  src={pickupMapSrc}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div>
                  <MapPin size={26} />
                  <span>{t("Enter pickup location to preview it on map")}</span>
                </div>
              )}
            </div>

            <label className="donate-instruction-field">
              <span><MessageSquare size={16} /> {t("Instructions / Important Message")}</span>
              <textarea
                className="donate-notes-box"
                name="storageInstructions"
                value={form.storageInstructions}
                onChange={update}
                placeholder={t("Example: Call before arrival, use back gate, food is in cold storage, bring large boxes, contains nuts...")}
              />
            </label>

            <div className="donate-hidden-options" aria-label="Food category and dietary options">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={selectedCategory === cat.id ? 'active' : ''}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {t(cat.label)}
                </button>
              ))}
            </div>

            {formMessage && (
              <div className={`form-notice ${formMessage.toLowerCase().includes('created') || formMessage.toLowerCase().includes('notified') ? 'success' : 'error'}`}>
                {t(formMessage)}
              </div>
            )}

            <button type="submit" className="donate-reference-submit">{t("Post Donation")}</button>
          </form>

          <aside className="donate-food-reference-side">
            <article className="donate-photo-card">
              <h3>{t("Food Photos")}</h3>
              <p>{t("Visual verification helps volunteers assess and distribute food faster.")}</p>
              <label
                className={`donate-photo-upload ${form.imageUrl ? 'has-image' : ''}`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleUploadDrop}
              >
                {form.imageUrl ? (
                  <img src={form.imageUrl} alt="Uploaded food" />
                ) : (
                  <>
                    <ImagePlus size={38} />
                    <strong>{t("Click to upload")}</strong>
                    <span>{t("SVG, PNG, JPG (max. 5MB)")}</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={updateImage} />
              </label>
              <div className="donate-photo-thumbs">
                {form.imageUrl ? <img src={form.imageUrl} alt="" /> : <Package size={42} />}
                <button type="button" onClick={() => setForm((current) => ({ ...current, imageUrl: '' }))}>
                  <ImagePlus size={22} />
                </button>
              </div>
            </article>

            <article className="donate-safety-card">
              <h3><AlertTriangle size={18} /> {t("Safety First")}</h3>
              <p><CheckCircle2 size={14} /> {t("Ensure food is stored in clean containers.")}</p>
              <p><CheckCircle2 size={14} /> {t("Clearly mark any common allergens.")}</p>
              <p><CheckCircle2 size={14} /> {t("Don't donate food past its expiry date.")}</p>
            </article>
          </aside>
        </div>
      </section>

      <section className="donor-dashboard-grid" style={{ marginTop: '24px' }}>
        <article className="donor-panel">
          <div className="panel-heading">
            <div>
              <p className="dashboard-kicker">{t("Quick Statistics")}</p>
              <h2>{t("Donation Analytics")}</h2>
            </div>
          </div>
          <div className="quick-stat-list">
            {quickStats.map(([label, value]) => (
              <div key={label}><span>{t(label)}</span><strong>{value}</strong></div>
            ))}
          </div>
        </article>
      </section>

      <section className="donor-history-page" id="donation-history">
        <div className="history-header-row">
          <div className="history-header-text">
            <h2>{t("Donation History")}</h2>
            <p>{t("Review your past contributions and their impact.")}</p>
          </div>
          <div className="history-filters">
            <div className="date-range-picker">
              <input type="date" className="filter-date-input" />
              <span>—</span>
              <input type="date" className="filter-date-input" />
            </div>
            <button className="btn-apply-filters" type="button">
              {t("Apply Filters")}
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="history-stats-grid">
          <div className="hist-stat-card">
            <div className="stat-card-icon-wrap icon-brown">
              <Heart size={20} fill="currentColor" />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-label">{t("Total Donations")}</span>
              <strong className="stat-card-val">{donationHistory.length}</strong>
            </div>
          </div>
          <div className="hist-stat-card">
            <div className="stat-card-icon-wrap icon-green">
              <Utensils size={20} />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-label">{t("Meals Provided")}</span>
              <strong className="stat-card-val">{totalMeals || 120}</strong>
            </div>
          </div>
          <div className="hist-stat-card">
            <div className="stat-card-icon-wrap icon-blue">
              <Users size={20} />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-label">{t("Partner NGOs")}</span>
              <strong className="stat-card-val">{12}</strong>
            </div>
          </div>
          <div className="hist-stat-card">
            <div className="stat-card-icon-wrap icon-amber">
              <Star size={20} fill="currentColor" />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-label">{t("Avg. Feedback")}</span>
              <strong className="stat-card-val">{t('Pending')}</strong>
            </div>
          </div>
        </div>

        {/* Premium Table Card */}
        <div className="history-table-card">
          <div className="history-table-wrapper">
            <table className="history-data-table">
              <thead>
                <tr>
                  <th>{t("DATE")}</th>
                  <th>{t("FOOD ITEM")}</th>
                  <th>{t("QUANTITY")}</th>
                  <th>{t("RECIPIENT (NGO/VOLUNTEER)")}</th>
                  <th>{t("RATING/FEEDBACK")}</th>
                  <th style={{ textAlign: 'right' }}>{t("ACTIONS")}</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const historyList = donationHistory;
                  const itemsPerPage = 3;
                  const totalPages = Math.ceil(historyList.length / itemsPerPage) || 1;
                  const currentHistoryPage = Math.min(historyPage, totalPages);
                  const startIndex = (currentHistoryPage - 1) * itemsPerPage;
                  const paginatedList = historyList.slice(startIndex, startIndex + itemsPerPage);

                  return paginatedList.map((item, idx) => {
                    const stars = item.rating || 5;
                    return (
                      <tr key={idx}>
                        <td className="hist-date-cell">
                          <span className="date-day">{new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span className="date-time">{new Date(item.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                        </td>
                        <td className="hist-item-cell">
                          <div className="food-item-name">
                            <span className="food-icon-wrap">
                              <Utensils size={16} />
                            </span>
                            <span className="food-title">{item.title}</span>
                          </div>
                        </td>
                        <td>
                          <span className="hist-qty-pill">{item.quantity}</span>
                        </td>
                        <td className="hist-recipient-cell">
                          <div className="recipient-info">
                            <span className="green-check-dot">✓</span>
                            <span>{item.acceptedBy?.name || item.assignedVolunteer?.name || t("Delivered to Hub")}</span>
                          </div>
                        </td>
                        <td className="hist-rating-cell">
                          <div className="rating-stars-row">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={13} className={i < stars ? 'star-gold' : 'star-gray'} fill="currentColor" />
                            ))}
                          </div>
                          {item.feedback && <span className="comment-text">"{item.feedback}"</span>}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn-hist-action"
                            type="button"
                            onClick={() => setSelectedDonationId(item._id)}
                            title={t("View Details")}
                          >
                            <ClipboardList size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination */}
          <div className="history-table-footer">
            {(() => {
                  const historyList = donationHistory;
              const itemsPerPage = 3;
              const totalPages = Math.ceil(historyList.length / itemsPerPage) || 1;
              const currentHistoryPage = Math.min(historyPage, totalPages);
              const startCount = (currentHistoryPage - 1) * itemsPerPage + 1;
              const endCount = Math.min(currentHistoryPage * itemsPerPage, historyList.length);

              return (
                <>
                  <span className="footer-entries-count">
                    {t(`Showing ${startCount} to ${endCount} of ${historyList.length} entries`)}
                  </span>
                  <div className="history-pagination">
                    <button
                      className="btn-pag-nav"
                      type="button"
                      disabled={currentHistoryPage === 1}
                      onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                    >
                      ‹
                    </button>
                    {[...Array(totalPages)].map((_, pageIdx) => {
                      const pNum = pageIdx + 1;
                      return (
                        <button
                          key={pNum}
                          className={`btn-pag-num${currentHistoryPage === pNum ? ' active' : ''}`}
                          type="button"
                          onClick={() => setHistoryPage(pNum)}
                        >
                          {pNum}
                        </button>
                      );
                    })}
                    <button
                      className="btn-pag-nav"
                      type="button"
                      disabled={currentHistoryPage === totalPages}
                      onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                    >
                      ›
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Bottom details row (Category Distribution + Banner Row) */}
        <div className="history-bottom-layout">
          <div className="hist-distribution-card">
            <h3>{t("Category Distribution")}</h3>
            <div className="dist-list">
              {categoryDistribution.map((item, index) => (
                <div className="dist-item" key={item.label}>
                  <div className="dist-label-row">
                    <span>{t(item.label)}</span>
                    <span>{item.percent}%</span>
                  </div>
                  <div className="progress-bar-wrap">
                    <span className="progress-fill" style={{ width: `${item.percent}%`, background: ['#e2973c', '#4b525d', '#ebdcd0'][index] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hist-banner-card">
            <img src="https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=600&q=80" alt="Food donation impact community support" />
            <div className="banner-overlay-premium">
              <h4>{t("ReliefShare Community")}</h4>
              <p>{t("Your contributions support local shelters daily.")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Redesigned Premium Notifications Section ── */}
      <section className="notif-page" id="notifications">
        
        {/* Header Row */}
        <div className="notif-header">
          <div className="notif-header-text">
            <h2>{t('Notifications')}</h2>
            <p>{t('Stay updated on your impact and logistics.')}</p>
          </div>
          <button 
            type="button" 
            className="notif-mark-read"
            onClick={handleMarkAllRead}
          >
            {t('Mark all as read')}
          </button>
        </div>

        {/* TODAY Section */}
        <div className="notif-group-container">
          <div className="notif-group-title">{t('TODAY')}</div>
          <div className="notif-list">
            {notificationsList.filter(item => item.category === 'today').map(item => {
              const parts = item.message.split(item.boldText);
              return (
                <div 
                  key={item.id} 
                  className={`notif-card ${item.unread ? 'unread' : ''} ${item.accentBorder ? 'accent-border' : ''}`}
                >
                  <div className="notif-card-inner">
                    {/* Left Icon */}
                    <div className={`notif-icon-wrap icon-${item.type}`}>
                      {item.type === 'pickup' && <Truck size={20} />}
                      {item.type === 'request' && <HeartHandshake size={20} />}
                      {item.type === 'volunteer' && <User size={20} />}
                      {item.type === 'milestone' && <Award size={20} />}
                    </div>

                    {/* Content Area */}
                    <div className="notif-content">
                      <div className="notif-top-row">
                        <h4 className="notif-card-title">
                          {t(item.title)}
                          {item.unread && <span className="notif-unread-dot" />}
                        </h4>
                        <span className="notif-time">{item.time}</span>
                      </div>

                      <p className="notif-message">
                        {parts[0]}
                        <strong>{item.boldText}</strong>
                        {parts[1]}
                      </p>

                      {/* Interactive Buttons */}
                      {item.buttons && item.buttons.length > 0 && (
                        <div className="notif-btn-row">
                          {item.buttons.map((btn, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className={`btn-notif-${btn.style}`}
                              onClick={() => handleNotificationAction(item, btn)}
                            >
                              {t(btn.label)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* YESTERDAY Section */}
        <div className="notif-group-container" style={{ marginTop: '28px' }}>
          <div className="notif-group-title">{t('YESTERDAY')}</div>
          <div className="notif-list">
            {notificationsList.filter(item => item.category === 'yesterday').map(item => {
              const parts = item.message.split(item.boldText);
              return (
                <div 
                  key={item.id} 
                  className={`notif-card ${item.unread ? 'unread' : ''}`}
                >
                  <div className="notif-card-inner">
                    {/* Left Icon */}
                    <div className={`notif-icon-wrap icon-${item.type}`}>
                      {item.type === 'pickup' && <Truck size={20} />}
                      {item.type === 'request' && <HeartHandshake size={20} />}
                      {item.type === 'volunteer' && <User size={20} />}
                      {item.type === 'milestone' && <Award size={20} />}
                    </div>

                    {/* Content Area */}
                    <div className="notif-content">
                      <div className="notif-top-row">
                        <h4 className="notif-card-title">{t(item.title)}</h4>
                        <span className="notif-time">{t(item.time)}</span>
                      </div>

                      <p className="notif-message">
                        {parts[0]}
                        <strong>{item.boldText}</strong>
                        {parts[1]}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="notif-footer">
          <button className="btn-notif-load-more" type="button">
            {t('Load Older Notifications')}
          </button>
        </div>
      </section>

      {/* ── Messages / Chat Section ── */}
      <section className="messages-inbox-page" id="messages" data-dashboard-section="messages">
        <div className="messages-layout">
          <div className="chats-sidebar">
            <div className="chats-sidebar-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} />
                <div>
                  <h3 style={{ margin: '0', fontWeight: '800', color: '#22252a' }}>{t("Messenger")}</h3>
                  <p style={{ margin: '2px 0 0 0', color: '#7b818a', fontWeight: '500' }}>{t("Chat with NGO & Volunteer")}</p>
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
                      <span className="chat-status" style={{ fontSize: '11px', textTransform: 'uppercase' }}>{t(contact.role || '')}</span>
                    </div>
                    {contact.phone && <p className="chat-preview" style={{ fontSize: '11px' }}>{contact.phone}</p>}
                  </div>
                </div>
              ))}
              {!chatContacts.length && <p style={{ padding: '16px', color: '#7b818a' }}>{t('No active chats yet.')}</p>}
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
                  <input 
                    type="text" 
                    value={newMessageText} 
                    onChange={(e) => setNewMessageText(e.target.value)} 
                    placeholder={t("Type a message...")} 
                    style={{ flex: 1, padding: '12px 16px', borderRadius: '24px', border: '1px solid #cbd5e0', outline: 'none', fontSize: '14px' }} 
                  />
                  <button type="submit" className="button button-primary" style={{ marginLeft: '12px', borderRadius: '50%', width: '42px', height: '42px', minHeight: '42px', padding: '0', display: 'grid', placeItems: 'center', background: '#83531b', boxShadow: 'none' }}>
                    <Send size={16} />
                  </button>
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

      {/* ── Redesigned Premium Profile Settings Section ── */}
      <section className="prof-page" id="profile" data-dashboard-section="profile">
        <ProfileSettingsPanel 
          profileForm={profileForm}
          updateProfileField={updateProfileField}
          profileNotice={profileNotice}
          handleProfileSave={handleProfileSave}
          user={user}
          donations={donations}
          totalMeals={totalMeals}
          t={t}
        />
      </section>

      {/* ── Redesigned Premium Settings Section (Matches Mockup Image) ── */}
      <section className="sett-page" id="settings" data-dashboard-section="settings">
        {/* Title Header */}
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
              {/* Row 1 */}
              <div className="sett-notif-row">
                <div className="sett-notif-text">
                  <strong>{t('Email Notifications')}</strong>
                  <span>{t('Receive impact reports and donation updates')}</span>
                </div>
                <label className="sett-switch" htmlFor="email-notif-toggle">
                  <input 
                    type="checkbox" 
                    id="email-notif-toggle"
                    checked={emailNotifications} 
                    onChange={(e) => setEmailNotifications(e.target.checked)} 
                  />
                  <span className="sett-slider" />
                </label>
              </div>

              {/* Row 2 */}
              <div className="sett-notif-row">
                <div className="sett-notif-text">
                  <strong>{t('SMS Alerts')}</strong>
                  <span>{t('Real-time pickup confirmations and urgent requests')}</span>
                </div>
                <label className="sett-switch" htmlFor="sms-alerts-toggle">
                  <input 
                    type="checkbox" 
                    id="sms-alerts-toggle"
                    checked={smsAlerts} 
                    onChange={(e) => setSmsAlerts(e.target.checked)} 
                  />
                  <span className="sett-slider" />
                </label>
              </div>

              {/* Row 3 */}
              <div className="sett-notif-row">
                <div className="sett-notif-text">
                  <strong>{t('System Announcements')}</strong>
                  <span>{t('New platform features and community news')}</span>
                </div>
                <label className="sett-switch" htmlFor="sys-ann-toggle">
                  <input 
                    type="checkbox" 
                    id="sys-ann-toggle"
                    checked={sysAnnouncements} 
                    onChange={(e) => setSysAnnouncements(e.target.checked)} 
                  />
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
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value)}
                  className="sett-select"
                >
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
              {/* Current Password */}
              <div className="sett-field">
                <span className="sett-field-label">{t('CURRENT PASSWORD')}</span>
                <div className="sett-input-with-eye">
                  <input 
                    type={showCurrentPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    className="sett-eye-btn"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="sett-field">
                <span className="sett-field-label">{t('NEW PASSWORD')}</span>
                <input 
                  type="password" 
                  placeholder={t("Enter new password")}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              {/* Confirm New Password */}
              <div className="sett-field">
                <span className="sett-field-label">{t('CONFIRM NEW PASSWORD')}</span>
                <input 
                  type="password" 
                  placeholder={t("Re-type new password")}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {securityNotice && (
              <div className="sett-sec-notice-success">
                {securityNotice}
              </div>
            )}

            {securityError && (
              <div className="sett-sec-notice-error">
                {securityError}
              </div>
            )}

            <div className="sett-security-actions">
              <div className="sett-sec-left">
                <button type="submit" className="btn-sett-change-pw">
                  {t('Change Password')}
                </button>
                <a href="#support" className="sett-forgot-link">{t('Forgot Password?')}</a>
              </div>

              <div className="sett-sec-right">
                <span className="sett-tfa-lbl">{t('Two-Factor Authentication:')}</span>
                <span className="sett-tfa-badge-disabled">{t('Disabled')}</span>
                <button type="button" className="btn-sett-tfa-enable">
                  {t('Enable 2FA')}
                </button>
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
            <p>{t('Have questions about donating food, tracking pickups, or your account? We\'re here to help 24/7.')}</p>
          </div>
        </div>

        <div className="support-main-card">
          {/* FAQ Section */}
          <div className="support-faq-section">
            <h3 className="support-section-title">{t('Frequently Asked Questions')}</h3>

            <SupportFAQ
              question={t('How do I donate food through FoodBridge?')}
              answer={t('Go to the "Donate Food" tab from your dashboard sidebar. Fill in the food details — type, quantity, pickup address, and expiry time — then submit. Nearby NGOs and volunteers will be notified instantly and can claim your donation for pickup.')}
            />
            <SupportFAQ
              question={t('How can I track the status of my donation?')}
              answer={t('Navigate to the "Track Donations" section to see real-time updates. Each donation goes through stages: Created → NGO Accepted → Volunteer Assigned → Picked Up → Delivered. You\'ll receive notifications at each stage.')}
            />
            <SupportFAQ
              question={t('What happens if no one claims my donation?')}
              answer={t('If your donation isn\'t claimed within the safe-before window, our system automatically alerts nearby partner NGOs and expands the search radius. You can also extend the pickup window or contact support for manual assistance.')}
            />
            <SupportFAQ
              question={t('Can I edit or cancel a donation after posting?')}
              answer={t('Yes, you can edit or cancel any donation that hasn\'t been picked up yet. Go to "My Active Donations", find the listing, and use the edit or cancel options. Once a volunteer has picked it up, changes are no longer possible.')}
            />
          </div>

          <div className="support-divider" />

          {/* Message Support Team */}
          <div className="support-contact-section">
            <h3 className="support-section-title">
              <MessageSquare size={18} />
              {t('Message Support Team')}
            </h3>
            <textarea
              className="support-textarea"
              placeholder={t('Describe your issue — e.g. a donation wasn\'t picked up, you need to change your account details, or have a question about the platform…')}
              rows={5}
            />
            <button className="btn-support-submit" type="button">
              <Send size={15} />
              {t('Submit Message')}
            </button>
          </div>
        </div>

        {/* Quick Contact Cards */}
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
            <p>{t('Speak directly with our team for urgent donation issues.')}</p>
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

function ProfileSettingsPanel({ profileForm, updateProfileField, profileNotice, handleProfileSave, user, donations, totalMeals, t }) {
  return (
    <>
      {/* Title Header */}
      <div className="prof-header">
        <div className="prof-header-text">
          <h2>{t('Profile Settings')}</h2>
          <p>{t('Manage your personal information and donation preferences.')}</p>
        </div>
        <div className="prof-verified-badge">
          <CheckCircle2 size={16} />
          <span>{t('Verified Donor')}</span>
        </div>
      </div>

      {/* Main Two-Column Card Grid */}
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
              <strong className="prof-metric-val">42</strong>
              <span className="prof-metric-lbl">{t('Donations')}</span>
            </div>
            <div className="prof-metric-item">
              <strong className="prof-metric-val">1.2k</strong>
              <span className="prof-metric-lbl">{t('Impact')}</span>
            </div>
          </div>
        </div>

        {/* Right Column Card (Form Details) */}
        <form className="prof-details-card" onSubmit={handleProfileSave}>
          <div className="prof-form-grid">
            <label className="prof-field">
              <span className="prof-field-label">{t('Full Name')}</span>
              <input 
                type="text" 
                name="name" 
                value={profileForm.name} 
                onChange={updateProfileField} 
                required 
              />
            </label>

            <label className="prof-field">
              <span className="prof-field-label">{t('Email Address')}</span>
              <input 
                type="email" 
                name="email" 
                value={profileForm.email} 
                onChange={updateProfileField} 
                required 
              />
            </label>

            <label className="prof-field">
              <span className="prof-field-label">{t('Phone Number')}</span>
              <input 
                type="text" 
                name="phone" 
                value={profileForm.phone} 
                onChange={updateProfileField} 
                required 
              />
            </label>

            <label className="prof-field">
              <span className="prof-field-label">{t('Account Type')}</span>
              <select 
                name="accountType" 
                value={profileForm.accountType} 
                onChange={updateProfileField}
              >
                <option value="Restaurant">Restaurant</option>
                <option value="Individual">Individual Donor</option>
                <option value="Supermarket">Supermarket</option>
                <option value="Corporate">Corporate Kitchen</option>
              </select>
            </label>

            <label className="prof-field full-width">
              <span className="prof-field-label">{t('Primary Pickup Address')}</span>
              <div className="prof-input-with-icon">
                <MapPin size={18} className="prof-field-icon" />
                <input 
                  type="text" 
                  name="address" 
                  value={profileForm.address} 
                  onChange={updateProfileField} 
                  required 
                />
              </div>
            </label>
          </div>

          {/* ProfileNotice Feedback */}
          {profileNotice && (
            <div className="prof-notice-success">
              {profileNotice}
            </div>
          )}

          {/* Save Button */}
          <div className="prof-action-row">
            <button type="submit" className="btn-prof-save">
              <span>{t('Save Changes')}</span>
              <Save size={18} />
            </button>
          </div>
        </form>
      </div>

      {/* Bottom Options Row */}
      <div className="prof-options-row">
        <div className="prof-option-card">
          <div className="prof-option-icon-circle">
            <Lock size={20} />
          </div>
          <div className="prof-option-text">
            <strong>{t('Security')}</strong>
            <span>{t('Manage password and 2FA')}</span>
          </div>
        </div>

        <div className="prof-option-card">
          <div className="prof-option-icon-circle">
            <Bell size={20} />
          </div>
          <div className="prof-option-text">
            <strong>{t('Alerts')}</strong>
            <span>{t('Delivery & pickup updates')}</span>
          </div>
        </div>

        <div className="prof-option-card prof-option-danger">
          <div className="prof-option-icon-circle icon-danger">
            <UserX size={20} />
          </div>
          <div className="prof-option-text text-danger">
            <strong className="lbl-danger">{t('Account')}</strong>
            <span>{t('Deactivate your profile')}</span>
          </div>
        </div>
      </div>
    </>
  );
}

function DonationTimeline({ donation }) {
  const { t } = useLanguage();
  if (!donation) return <p>{t("No donation available for tracking.")}</p>;

  const activeIndex = Math.max(0, statusSteps.findIndex(([status]) => status === donation.status));

  return (
    <div className="donation-timeline beautiful">
      {statusSteps.map(([status, label], index) => (
        <div className={index <= activeIndex ? 'complete' : ''} key={status}>
          <span>{index <= activeIndex ? <CheckCircle2 size={16} /> : <Clock size={16} />}</span>
          <div>
            <strong>{t(label)}</strong>
            <small>{index <= activeIndex ? t('Completed or in progress') : t('Waiting')}</small>
          </div>
        </div>
      ))}
    </div>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
      <path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-8.5Z" />
    </svg>
  );
}

function TrackItems({ donation }) {
  const quantity = donation?.quantity || '24 units';
  const title = donation?.title || 'Sourdough Loaves';
  const items = [
    [title, quantity],
    ['Mixed Pastries', '12 boxes'],
    ['Whole Wheat Flour', '15 lbs']
  ];

  return (
    <div className="track-items-list">
      {items.map(([label, value]) => (
        <p key={label}><span>{label}</span><strong>{value}</strong></p>
      ))}
    </div>
  );
}

function TrackProgress({ donation }) {
  const currentStatus = donation?.status || 'picked_up';
  const steps = [
    ['posted', 'Donation Confirmed', 'Requested at 10:15 AM · 45.5 lbs of fresh produce'],
    ['accepted', 'Driver Assigned', 'David M. accepted your pickup at 12:30 PM'],
    ['pickup_scheduled', 'Out for Pickup', 'Driver is currently 2.4 miles away'],
    ['picked_up', 'Arrival & Loading', 'Expected at 2:45 PM'],
    ['delivered', 'Delivered', 'Food received by partner NGO']
  ];
  const activeIndex = Math.max(0, steps.findIndex(([status]) => status === currentStatus));

  return (
    <div className="track-progress-list">
      {steps.map(([status, title, text], index) => {
        const done = index <= activeIndex;
        const active = index === activeIndex;
        return (
          <div className={`${done ? 'done' : ''} ${active ? 'active' : ''}`} key={status}>
            <span>{done ? <CheckCircle2 size={16} /> : active ? <Truck size={15} /> : <MapPin size={15} />}</span>
            <div>
              <strong>{title}</strong>
              <p>{text}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActivityTimeline({ donation }) {
  const { t } = useLanguage();
  if (!donation) return <p>{t("Create a donation to see activity.")}</p>;

  const activeIndex = Math.max(0, statusSteps.findIndex(([status]) => status === donation.status));
  return (
    <div className="activity-timeline">
      {statusSteps.map(([, label], index) => (
        <div className={index <= activeIndex ? 'done' : ''} key={label}>
          <span>✓</span>
          <p>{t(label)}</p>
        </div>
      ))}
      {donation.status === 'accepted' && (
        <div className="done"><span>✓</span><p>{t("Volunteer Assigned")}</p></div>
      )}
    </div>
  );
}

function ActivityRow({ icon, tone = 'neutral', title, text, tag, positive = false }) {
  return (
    <div className="activity-row-reference">
      <span className={`activity-row-icon ${tone}`}>{icon}</span>
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
        <small className={positive ? 'positive' : ''}>{tag}</small>
      </div>
    </div>
  );
}

function ImpactStoryModal({ onClose }) {
  return (
    <div className="impact-modal-backdrop" role="presentation" onClick={onClose}>
      <article className="impact-modal-card" role="dialog" aria-modal="true" aria-labelledby="impact-story-title" onClick={(event) => event.stopPropagation()}>
        <button className="impact-modal-close" type="button" aria-label="Close report" onClick={onClose}><X size={24} /></button>
        <img src="https://images.unsplash.com/photo-1547496502-affa22d38842?auto=format&fit=crop&w=1100&q=85" alt="" />
        <div className="impact-modal-body">
          <span>FULL REPORT VERIFIED</span>
          <h2 id="impact-story-title">How your last donation changed 20 lives.</h2>
          <p>Springfield's after-school programs serve as a vital safety net for families experiencing grocery shortages. On Tuesday afternoon, our verified partner received and distributed your listed surplus pastries and fresh fruits to the children of Sunrise Center.</p>
          <p>"The snacks were of incredible bakery quality, completely fresh, and made the kids extremely excited. Knowing it came directly from local food businesses breeds a powerful trust within the neighborhood," said Maria Gutierrez, Sunrise Center director.</p>
          <div className="impact-carbon-card">
            <span><Leaf size={28} fill="currentColor" /></span>
            <div><small>CARBON SAVINGS</small><strong>120 kg greenhouse gases saved</strong></div>
            <b>Eco Level Up!</b>
          </div>
          <button type="button" onClick={onClose}>Close Report</button>
        </div>
      </article>
    </div>
  );
}

function getDonationKg(donation) {
  const quantity = String(donation?.quantity || '');
  const number = Number(quantity.match(/\d+(\.\d+)?/)?.[0] || 0);
  if (!number) return 0;
  if (/meal|pack|serving|pax|unit|box|tray|pan/i.test(quantity)) return Math.round(number * 0.45);
  return number;
}

function buildDonationTrend(donations, mode) {
  const now = new Date();
  const items = mode === 'monthly'
    ? ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((label) => ({ label, kg: 0 }))
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => ({ label, kg: 0 }));

  donations.forEach((donation) => {
    const date = new Date(donation.createdAt || donation.pickupWindowStart || donation.safeBefore || Date.now());
    if (Number.isNaN(date.getTime())) return;

    if (mode === 'monthly') {
      const sameMonth = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
      if (!sameMonth) return;
      const weekIndex = Math.min(3, Math.floor((date.getDate() - 1) / 7));
      items[weekIndex].kg += getDonationKg(donation);
      return;
    }

    const day = date.getDay();
    const index = day === 0 ? -1 : day - 1;
    if (index < 0 || index > 5) return;

    const startOfWeek = new Date(now);
    const currentDay = startOfWeek.getDay() || 7;
    startOfWeek.setDate(startOfWeek.getDate() - currentDay + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    if (date < startOfWeek || date >= endOfWeek) return;

    items[index].kg += getDonationKg(donation);
  });

  const max = Math.max(1, ...items.map((item) => item.kg));
  const highlightIndex = items.reduce((best, item, index) => item.kg > items[best].kg ? index : best, 0);
  return { items, max, highlightIndex };
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
