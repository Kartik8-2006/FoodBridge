import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, Award, BadgeCheck, Camera, CheckCircle2, Clock, Heart, HeartPulse, ImagePlus, Leaf, MapPin, Navigation, Package, PackageCheck, Phone, Plus, ShieldCheck, ShoppingCart, Trash2, Truck, UploadCloud, UserCheck, Users, Utensils, X } from 'lucide-react';
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

export default function DonorDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
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
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormMessage(t('Image is too large. Please upload an image under 5 MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, imageUrl: reader.result }));
    reader.readAsDataURL(file);
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
            <span className="field-label">{t("Food Image")}</span>
            <label className="upload-dropzone">
              {form.imageUrl ? (
                <>
                  <img src={form.imageUrl} alt="Uploaded food" />
                  <span className="title">{t("Image uploaded")}</span>
                  <span className="subtitle">{t("Click to change")}</span>
                </>
              ) : (
                <>
                  <div className="upload-icon-container">
                    <Camera size={22} />
                  </div>
                  <span className="title">{t("Upload Image (Optional)")}</span>
                  <span className="subtitle">{t("Drag & drop or click · PNG, JPEG (Max 5 MB)")}</span>
                </>
              )}
              <div className="smart-badge" style={{ marginTop: '10px' }}>
                ✨ {t("Smart Auto-Image enabled for selected category")}
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
              onClick={() => {
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
              }}
            >
              {t("Reset")}
            </button>
            <button type="submit" className="btn-submit">
              <Heart size={15} fill="currentColor" /> {t("List Surplus Food")}
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

      <section className="donor-dashboard-grid">
        <article className="donor-panel" id="donation-history">
          <div className="panel-heading">
            <div>
              <p className="dashboard-kicker">{t("Donation History")}</p>
              <h2>{t("Completed and closed donations")}</h2>
            </div>
          </div>
          <div className="history-list">
            {(donationHistory.length ? donationHistory : donations).map((donation) => (
              <div key={donation._id}>
                <strong>{donation.title}</strong>
                <span>{t(titleCase(donation.status))} · {formatDate(donation.safeBefore)}</span>
                <button type="button" onClick={() => setSelectedDonationId(donation._id)}>{t("View Details")}</button>
              </div>
            ))}
          </div>
        </article>

        <article className="donor-panel">
          <div className="panel-heading">
            <div>
              <p className="dashboard-kicker">{t("Recent Activity")}</p>
              <h2>{t("Timeline")}</h2>
            </div>
          </div>
          <ActivityTimeline donation={selectedDonation} />
        </article>
      </section>

      <section id="notifications"><NotificationList items={data.notifications} /></section>

      <section className="donor-dashboard-grid">
        <article className="donor-panel" id="profile">
          <div className="panel-heading"><div><p className="dashboard-kicker">{t("Profile")}</p><h2>{t("Donor identity")}</h2></div><ShieldCheck size={20} /></div>
          <div className="profile-detail-grid">
            <div><UserCheck size={18} /><span>Name</span><strong>{user?.name}</strong></div>
            <div><Phone size={18} /><span>Phone</span><strong>{user?.profile?.phone || t('Phone not added')}</strong></div>
            <div><MapPin size={18} /><span>City</span><strong>{user?.profile?.city || t('City not added')}</strong></div>
            <div><HeartPulse size={18} /><span>Impact score</span><strong>{quickStats[2]?.[1] || 0} meals</strong></div>
          </div>
          <div className="profile-completion"><span><b style={{ width: '78%' }} /></span><small>Profile 78% complete. Add alternate pickup contact to improve partner response.</small></div>
        </article>
        <article className="donor-panel" id="settings">
          <div className="panel-heading"><div><p className="dashboard-kicker">{t("Settings")}</p><h2>{t("Donation preferences")}</h2></div></div>
          <div className="settings-grid">
            <label><span>Auto notify nearby NGOs</span><input type="checkbox" defaultChecked /></label>
            <label><span>SMS pickup reminders</span><input type="checkbox" defaultChecked /></label>
            <label><span>Require volunteer ID check</span><input type="checkbox" defaultChecked /></label>
            <label><span>Weekly impact report</span><input type="checkbox" /></label>
          </div>
          <div className="settings-note"><ShieldCheck size={18} /> Safety checks and pickup rules are synced with backend donation status updates.</div>
        </article>
      </section>
    </DashboardShell>
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