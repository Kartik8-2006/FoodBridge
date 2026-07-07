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

const categoryFallbackImages = {
  cooked: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
  produce: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
  bakery: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
  packaged: 'https://images.unsplash.com/photo-1595853035070-59a39fe84de3?auto=format&fit=crop&w=600&q=80',
};

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

const mockHistoryList = [
  {
    createdAt: new Date('2024-10-24T14:20:00').toISOString(),
    title: 'Fresh Sandwiches',
    quantity: '25 Units',
    acceptedBy: { name: 'City Hope Shelter' },
    feedback: 'Timely & high quality',
    rating: 5,
    foodType: 'cooked'
  },
  {
    createdAt: new Date('2024-10-21T09:15:00').toISOString(),
    title: 'Assorted Pastries',
    quantity: '15 KG',
    acceptedBy: { name: 'Global Relief Org' },
    feedback: 'Efficient pickup',
    rating: 4,
    foodType: 'bakery'
  },
  {
    createdAt: new Date('2024-10-18T18:45:00').toISOString(),
    title: 'Cooked Rice & Dal',
    quantity: '40 Pax',
    acceptedBy: { name: 'Green Valley Volunteer' },
    feedback: 'Highly appreciated!',
    rating: 5,
    foodType: 'cooked'
  },
  {
    createdAt: new Date('2024-10-15T11:30:00').toISOString(),
    title: 'Fruit Baskets',
    quantity: '12 Boxes',
    acceptedBy: { name: 'City Hope Shelter' },
    feedback: 'Very fresh fruit!',
    rating: 5,
    foodType: 'produce'
  },
  {
    createdAt: new Date('2024-10-12T16:00:00').toISOString(),
    title: 'Mixed Vegetable Curry',
    quantity: '30 Servings',
    acceptedBy: { name: 'Global Relief Org' },
    feedback: 'Delicious and hot',
    rating: 5,
    foodType: 'cooked'
  },
  {
    createdAt: new Date('2024-10-09T08:00:00').toISOString(),
    title: 'Bread Rolls',
    quantity: '50 Units',
    acceptedBy: { name: 'Green Valley Volunteer' },
    feedback: 'Great distribution',
    rating: 4,
    foodType: 'bakery'
  }
];

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
  const [notificationsList, setNotificationsList] = useState([
    {
      id: 1,
      type: 'pickup',
      title: 'Donation Picked Up',
      time: '10:45 AM',
      message: 'Your donation of 50 Meals has been successfully collected by our logistics partner. It\'s on its way to the downtown shelter.',
      boldText: '50 Meals',
      category: 'today',
      unread: false,
      buttons: [
        { label: 'Track Delivery', style: 'dark', action: 'track' },
        { label: 'View Details', style: 'outline', action: 'details' }
      ]
    },
    {
      id: 2,
      type: 'request',
      title: 'NGO Requesting Food',
      time: '8:20 AM',
      message: 'City Outreach Center has an urgent need for non-perishable goods in your area. Can you help today?',
      boldText: 'City Outreach Center',
      category: 'today',
      unread: true,
      accentBorder: true,
      buttons: [
        { label: 'Respond Now', style: 'primary', action: 'respond' }
      ]
    },
    {
      id: 3,
      type: 'volunteer',
      title: 'Volunteer Assigned',
      time: 'Yesterday',
      message: 'Volunteer Sarah Jenkins has been assigned to your scheduled pickup tomorrow at 2:00 PM.',
      boldText: 'Sarah Jenkins',
      category: 'yesterday',
      unread: false
    },
    {
      id: 4,
      type: 'milestone',
      title: 'Milestone Reached!',
      time: 'Yesterday',
      message: 'Congratulations! You\'ve officially donated over 100kg of fresh produce this year. Check out your updated impact report.',
      boldText: '100kg',
      category: 'yesterday',
      unread: false
    }
  ]);

  const handleMarkAllRead = () => {
    setNotificationsList(prev => prev.map(item => ({ ...item, unread: false })));
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
    name: user?.name || 'Alexander Bennett',
    email: user?.email || 'alexander.b@harvestgate.c',
    phone: user?.profile?.phone || '+1 (555) 123-4567',
    accountType: 'Restaurant',
    address: user?.profile?.address || '742 Evergreen Terrace, Springfield, IL 62704'
  });
  const [profileNotice, setProfileNotice] = useState('');

  const updateProfileField = (e) => {
    const { name, value } = e.target;
    setProfileForm(current => ({ ...current, [name]: value }));
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    setProfileNotice(t('Profile settings saved successfully!'));
    setTimeout(() => setProfileNotice(''), 3000);
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

  const donations = data?.donations || [];
  const selectedDonation = donations.find((item) => item._id === selectedDonationId) || donations[0];

  const activeDonations = donations.filter((item) => ['posted', 'accepted', 'pickup_scheduled', 'picked_up'].includes(item.status));
  const donationHistory = donations.filter((item) => ['delivered', 'cancelled', 'expired'].includes(item.status));
  const totalMeals = donations.reduce((sum, item) => sum + Number(item.estimatedMeals || 0), 0);
  const foodSavedKg = donations.reduce((sum, item) => sum + getDonationKg(item), 0);
  const trendData = useMemo(() => buildDonationTrend(donations, trendMode), [donations, trendMode]);

  useEffect(() => {
    if (user) {
      setForm((current) => ({
        ...current,
        pickupAddress: current.pickupAddress || user.profile?.address || '',
        city: current.city || user.profile?.city || 'Bengaluru',
        contactNumber: current.contactNumber || user.profile?.phone || user.phone || ''
      }));
    }
  }, [user]);

  useEffect(() => {
    const defaultPickupTime = new Date(Date.now() + 60 * 60 * 1000);
    defaultPickupTime.setMinutes(0, 0, 0);
    setPickupTime(formatDateTimeLocal(defaultPickupTime));
  }, []);

  const quickStats = useMemo(() => {
    const ngosHelped = new Set(donations.map((item) => item.acceptedBy?._id || item.acceptedBy).filter(Boolean)).size;
    const volunteersAssigned = donations.filter((item) => item.assignedVolunteer).length;

    return [
      ['Total Donations', donations.length],
      ['Food Saved (kg)', foodSavedKg || t('Pending')],
      ['Meals Provided', totalMeals],
      ['NGOs Helped', ngosHelped],
      ['Volunteers Assigned', volunteersAssigned],
      ['Average Pickup Time', donations.length ? '2.4 hrs' : t('Pending')]
    ];
  }, [donations, foodSavedKg, totalMeals, t]);

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
      city: user?.profile?.city || 'Bengaluru',
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

    const finalImageUrl = form.imageUrl || categoryFallbackImages[selectedCategory];

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
        city: user.profile?.city || 'Bengaluru',
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
            <p>Good morning! Your contributions have helped 15 families this week.</p>
          </div>
          <article className="saved-chip">
            <span><Leaf size={24} fill="currentColor" /></span>
            <div><small>TOTAL SAVED</small><strong>{foodSavedKg || 450} kg Food</strong></div>
          </article>
        </div>

        <section className="donor-home-top-grid">
          <article className="donor-home-stat">
            <span className="donor-stat-icon warm"><Utensils size={27} /></span>
            <small>TOTAL MEALS DONATED</small>
            <strong>{(totalMeals || 1270).toLocaleString()}</strong>
            <em>↗ +12% from last month</em>
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
            <strong>82</strong>
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
              <ActivityRow icon={<ShoppingCart size={26} />} tone="warm" title="Vegetable Crate Pick-up" text="Scheduled for tomorrow, 10:00 AM" tag="PENDING" />
              <ActivityRow icon={<CheckCircle2 size={26} />} title="Donation Delivered" text="25kg of Grains reached City Shelter" tag="COMPLETED · 2H AGO" positive />
              <ActivityRow icon={<Award size={26} />} title="Achievement Unlocked" text="You've hit the '1000 Meals' milestone!" tag="SYSTEM · 1D AGO" />
            </div>
          </article>
        </section>

        <button className="impact-story-card" type="button" onClick={() => setImpactOpen(true)}>
          <img src="https://images.unsplash.com/photo-1547496502-affa22d38842?auto=format&fit=crop&w=900&q=85" alt="" />
          <span>
            <small>IMPACT STORY</small>
            <strong>How your last donation changed 20 lives.</strong>
            <em>Last Tuesday, your surplus bakery items were distributed to the Sunrise Community Center. 20 local students received fresh nutritious snacks during their after-school programs.</em>
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

            const fallbackImage = categoryFallbackImages[donation.foodType] || categoryFallbackImages.cooked;
            const displayImage = donation.imageUrl || fallbackImage;

            return (
              <article className="donation-card-premium" key={donation._id}>
                <div className="card-image-wrapper">
                  <span className={`card-badge ${badgeClass}`}>{badgeText}</span>
                  <img src={displayImage} alt={donation.title} />
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
                      <div className="partner-eta-badge">{t("15 mins")}</div>
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
      <section className="donor-dashboard-grid" id="track-donations" style={{ marginTop: '24px' }}>
        <article className="donor-panel large">
          <div className="panel-heading">
            <div>
              <p className="dashboard-kicker">{t("Track Donation")}</p>
              <h2>{selectedDonation?.title || t('No donation selected')}</h2>
            </div>
          </div>
          <div className="tracking-stack">
            <DonationTimeline donation={selectedDonation} />
            <TrackingMap donation={selectedDonation} />
          </div>
        </article>
      </section>

      {/* Surplus Food Donation Form */}
      <section className="surplus-food-section" id="donate-food">
        <h2>{t("Surplus Food Donation")}</h2>
        <p className="sub">{t("Fill out the details below to share your surplus food. Make sure it's fresh and safe for consumption.")}</p>

        <form onSubmit={submitDonation}>
          {/* Row 1: Title + Quantity */}
          <div className="form-two-col">
            <label>
              <span className="field-label">{t("What are you donating?")}{' '}<span style={{ color: '#e2973c' }}>*</span></span>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={update}
                placeholder={t("e.g. Mixed Veggie Salads, Fresh Sandwiches")}
                required
              />
            </label>
            <label>
              <span className="field-label">{t("Quantity / Weight")}{' '}<span style={{ color: '#e2973c' }}>*</span></span>
              <input
                type="text"
                name="quantity"
                value={form.quantity}
                onChange={update}
                placeholder={t("e.g. 25 servings, 10 kg, 30 units")}
                required
              />
            </label>
          </div>

          {/* Row 2: Food Category */}
          <div className="form-row">
            <span className="field-label">{t("Food Category")}</span>
            <div className="category-buttons">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {t(cat.label)}
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: Expires + Pickup Window */}
          <div className="form-two-col">
            <div className="expiry-slider-container">
              <div className="slider-label-row">
                <span className="field-label" style={{ margin: 0 }}>{t("Expires in")}</span>
                <span className="hours-badge">{expiresInHours} {t("hrs")}</span>
              </div>
              <input
                type="range"
                min="1"
                max="48"
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(Number(e.target.value))}
                className="expiry-slider"
              />
              <div className="slider-warning">
                <AlertTriangle size={14} />
                <span>{t("Recommend at least 3 hours of safe buffer.")}</span>
              </div>
            </div>

            <div>
              <span className="field-label">{t("Preferred Pickup Window")}{' '}<span style={{ color: '#e2973c' }}>*</span></span>
              <div className="input-icon-wrap">
                <Clock size={15} />
                <input
                  type="datetime-local"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Row 4: Pickup Location */}
          <div className="form-row">
            <span className="field-label">{t("Pickup Location")}{' '}<span style={{ color: '#e2973c' }}>*</span></span>
            <div className="input-icon-wrap">
              <MapPin size={15} />
              <input
                type="text"
                name="pickupAddress"
                value={form.pickupAddress}
                onChange={update}
                placeholder={t("Enter full pickup address")}
                required
              />
            </div>
            <p className="field-hint">{t("Defaults to your saved account address.")}</p>
          </div>

          {/* Row 5: Dietary Labels */}
          <div className="form-row">
            <span className="field-label">{t("Dietary Labels")}</span>
            <p style={{ fontSize: '13px', color: '#98a2b3', margin: '0 0 10px' }}>{t("Select all that apply")}</p>
            <div className="dietary-grid">
              {dietaryLabelsList.map((label) => (
                <button
                  key={label}
                  type="button"
                  className={`dietary-pill ${selectedLabels.includes(label) ? 'active' : ''}`}
                  onClick={() => toggleLabel(label)}
                >
                  {t(label)}
                </button>
              ))}
            </div>
          </div>

          {/* Row 6: Storage Instructions */}
          <div className="form-row">
            <span className="field-label">{t("Special Instructions / Storage Details")}</span>
            <textarea
              name="storageInstructions"
              value={form.storageInstructions}
              onChange={update}
              placeholder={t("e.g. Keep refrigerated, ring back doorbell, packed in disposable boxes...")}
            />
          </div>

          {/* Row 7: Image Upload */}
          <div className="form-row">
            <label
              className={`upload-dropzone ${form.imageUrl ? 'has-image' : ''}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleUploadDrop}
            >
              {form.imageUrl ? (
                <>
                  <img src={form.imageUrl} alt="Uploaded food" />
                  <span className="title">{t("Image uploaded")}</span>
                  <span className="subtitle">{t("Click to browse another file")}</span>
                  <button
                    className="remove-upload"
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      setForm((current) => ({ ...current, imageUrl: '' }));
                    }}
                  >
                    {t("Remove image")}
                  </button>
                </>
              ) : (
                <>
                  <div className="upload-icon-container">
                    <UploadCloud size={32} />
                  </div>
                  <span className="title">{t("Upload Image (Optional)")}</span>
                  <span className="subtitle">{t("Drag and drop files here, or click to browse. Supported types: PNG, JPEG (Max 5MB)")}</span>
                </>
              )}
              <div className="smart-badge">
                <ImagePlus size={18} /> {t("Smart Auto-Image enabled based on your Selected Category!")}
              </div>
              <input type="file" accept="image/*" onChange={updateImage} style={{ display: 'none' }} />
            </label>
          </div>

          {/* Form feedback */}
          {formMessage && (
            <div className={`form-notice ${formMessage.toLowerCase().includes('created') || formMessage.toLowerCase().includes('notified') ? 'success' : 'error'}`}>
              {t(formMessage)}
            </div>
          )}

          {/* Actions */}
          <div className="form-actions-row">
            <button
              type="button"
              className="btn-cancel"
              onClick={resetDonationForm}
            >
              {t("Cancel")}
            </button>
            <button type="submit" className="btn-submit">
              <Heart size={28} fill="currentColor" /> {t("List surplus food")}
            </button>
          </div>
        </form>
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
              <strong className="stat-card-val">{donationHistory.length || 48}</strong>
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
              <strong className="stat-card-val">4.9</strong>
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
                  const historyList = donationHistory.length ? donationHistory : mockHistoryList;
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
              const historyList = donationHistory.length ? donationHistory : mockHistoryList;
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
              <div className="dist-item">
                <div className="dist-label-row">
                  <span>{t("Perishables")}</span>
                  <span>65%</span>
                </div>
                <div className="progress-bar-wrap">
                  <span className="progress-fill" style={{ width: '65%', background: '#e2973c' }} />
                </div>
              </div>
              <div className="dist-item">
                <div className="dist-label-row">
                  <span>{t("Packed / Canned")}</span>
                  <span>20%</span>
                </div>
                <div className="progress-bar-wrap">
                  <span className="progress-fill" style={{ width: '20%', background: '#4b525d' }} />
                </div>
              </div>
              <div className="dist-item">
                <div className="dist-label-row">
                  <span>{t("Bakery / Bread")}</span>
                  <span>15%</span>
                </div>
                <div className="progress-bar-wrap">
                  <span className="progress-fill" style={{ width: '15%', background: '#ebdcd0' }} />
                </div>
              </div>
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

      {/* ── Redesigned Premium Profile Settings Section ── */}
      <section className="prof-page" id="profile" data-dashboard-section="profile">
        <ProfileSettingsPanel 
          profileForm={profileForm}
          updateProfileField={updateProfileField}
          profileNotice={profileNotice}
          handleProfileSave={handleProfileSave}
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

function ProfileSettingsPanel({ profileForm, updateProfileField, profileNotice, handleProfileSave, t }) {
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
              <img 
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
                alt="Alexander Bennett" 
                className="prof-avatar-img"
              />
              <button type="button" className="prof-avatar-edit-btn" title={t('Edit avatar')}>
                <Edit2 size={14} />
              </button>
            </div>
          </div>
          <h3 className="prof-summary-name">{profileForm.name}</h3>
          <span className="prof-summary-active-since">{t('Active since Nov 2023')}</span>

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
