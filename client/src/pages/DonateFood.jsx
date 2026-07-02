import { useState } from 'react';
import { Camera, CheckCircle2, Clock3, LocateFixed, MapPin, PackageCheck, Phone, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';
import { api } from '../api.js';
import { DetailPage } from '../components/DetailPage.jsx';
import { AuthModal } from '../components/Layout.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const sections = [
  {
    id: 'donate-funds',
    title: 'Support pickup routes and rescue operations',
    image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=1000&q=85',
    text: [
      'FoodBridge uses funding to keep verified pickup routes active, support emergency delivery coordination, and help NGOs move food safely when donors cannot provide transport.',
      'Financial gifts also help with cold storage, safety supplies, outreach, and technology that keeps donor, volunteer, NGO, and recipient workflows connected.'
    ],
    cta: { label: 'Create Donor Account', action: 'register-donor' }
  },
  {
    id: 'food-safety',
    title: 'Food safety starts before posting',
    reverse: true,
    image: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&w=1000&q=85',
    bullets: [
      'Post only fresh, clearly identified food with known preparation or purchase time.',
      'Add safe-before time, allergen notes, storage guidance, and pickup instructions.',
      'Avoid opened, spoiled, unlabeled, or temperature-abused food.'
    ]
  },
  {
    id: 'pickup-preparation',
    title: 'Prepare a pickup that volunteers can complete quickly',
    image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1000&q=85',
    text: [
      'Pack donations in clean containers, keep hot food hot and cold food cold, and make sure the contact person is available during the pickup window.',
      'Clear pickup details reduce delays and help NGOs distribute food while it is still safe and useful.'
    ]
  }
];

const values = [
  { title: 'Safety', text: 'Every food post includes timing, handling, and allergy details.' },
  { title: 'Speed', text: 'Verified partners can accept and move donations before quality drops.' },
  { title: 'Trust', text: 'Each donation is tied to a donor account and status updates.' },
  { title: 'Dignity', text: 'Food reaches people through organized community partners.' }
];

export default function DonateFood() {
  const { user } = useAuth();
  const initialForm = {
    title: '',
    foodType: 'cooked',
    dietType: 'veg',
    quantity: '',
    estimatedMeals: 20,
    pickupAddress: '',
    city: '',
    contactNumber: user?.profile?.phone || '',
    pickupWindowStart: '',
    pickupWindowEnd: '',
    safeBefore: '',
    storageInstructions: '',
    allergenNotes: '',
    imageUrl: '',
    distributionTarget: 'families'
  };
  const [form, setForm] = useState(initialForm);
  const [authModal, setAuthModal] = useState(null);
  const [pickupLocation, setPickupLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('');
  const [submission, setSubmission] = useState({ loading: false, message: '', error: '', donationId: '' });

  function update(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function captureLocation() {
    if (!navigator.geolocation) {
      setLocationStatus('Location is not supported by this browser.');
      return;
    }
    setLocationStatus('Detecting pickup location...');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPickupLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          label: form.pickupAddress || 'Donation pickup'
        });
        setLocationStatus('Precise pickup location attached.');
      },
      () => setLocationStatus('Could not access location. You can still submit the address.'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  async function submit(event) {
    event.preventDefault();
    setSubmission({ loading: true, message: '', error: '', donationId: '' });
    try {
      if (new Date(form.pickupWindowEnd) <= new Date(form.pickupWindowStart)) {
        throw new Error('Pickup end time must be after pickup start time.');
      }
      if (new Date(form.safeBefore) < new Date(form.pickupWindowStart)) {
        throw new Error('Safe-before time must cover the pickup start time.');
      }
      const data = await api('/donations', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          estimatedMeals: Number(form.estimatedMeals),
          ...(pickupLocation ? { pickupLocation } : {})
        })
      });
      setSubmission({
        loading: false,
        message: 'Donation posted successfully. Nearby NGOs have been notified.',
        error: '',
        donationId: data.donation?._id || ''
      });
      setForm({ ...initialForm, contactNumber: user?.profile?.phone || '' });
      setPickupLocation(null);
      setLocationStatus('');
    } catch (error) {
      setSubmission({ loading: false, message: '', error: error.message, donationId: '' });
    }
  }

  const canDonate = user && (user.role === 'donor' || user.role === 'admin');

  return (
    <>
    <DetailPage
      onAction={(action) => action === 'register-donor' && setAuthModal({ initialMode: 'signup', initialRole: 'donor', lockRole: true })}
      hero={{
        eyebrow: 'Donate Food',
        title: 'Give surplus food a safe second life',
        text: 'Post clear food details so verified NGOs and volunteers can rescue meals before they go to waste.',
        tone: 'red',
        image: 'https://images.unsplash.com/photo-1593113630400-ea4288922497?auto=format&fit=crop&w=1400&q=85'
      }}
      navItems={[
        { id: 'donate-funds', label: 'Donate funds' },
        { id: 'donate-food-section', label: 'Donate food' },
        { id: 'food-safety', label: 'Food safety' },
        { id: 'pickup-preparation', label: 'Pickup preparation' }
      ]}
      sections={sections}
      values={values}
    >
      <section className="donation-workspace" id="donate-food-section">
        <aside className="donation-workspace-story">
          <div className="donation-story-image donation-story-image-main" role="img" aria-label="Volunteers packing rescued food for distribution" />
          <div className="donation-story-image donation-story-image-small" role="img" aria-label="Food donation handoff to a community partner" />
          <div className="donation-story-copy">
            <p className="eyebrow">Live food rescue</p>
            <h2>One clear post starts a safe local rescue.</h2>
            <p>FoodBridge matches your pickup-ready donation with nearby verified NGOs. Accurate details help partners respond before food quality drops.</p>
            <div className="donation-process">
              <span><strong>01</strong><span><b>Post safely</b><small>Add quantity, timing and handling notes.</small></span></span>
              <span><strong>02</strong><span><b>Match locally</b><small>Up to five nearby NGOs receive an alert.</small></span></span>
              <span><strong>03</strong><span><b>Track impact</b><small>Follow acceptance, pickup and delivery.</small></span></span>
            </div>
            <div className="donation-safety-note"><ShieldCheck size={20} /><span><strong>Food safety first</strong><small>Only post food that is fresh, sealed or safely packed.</small></span></div>
          </div>
          {!user && (
            <div className="donation-auth-actions">
              <button type="button" onClick={() => setAuthModal({ initialMode: 'login', initialRole: 'donor' })}>Login</button>
              <button type="button" onClick={() => setAuthModal({ initialMode: 'signup', initialRole: 'donor', lockRole: true })}>Create donor account</button>
            </div>
          )}
        </aside>

        <form className="donation-live-form" onSubmit={submit}>
          <header className="donation-form-head">
            <div><p className="eyebrow">Donation details</p><h2>Post surplus food</h2></div>
            <span><Sparkles size={18} /> Live matching</span>
          </header>
          {!canDonate && <div className="donation-form-alert">Create or login with a donor account to activate this form.</div>}

          <fieldset disabled={!canDonate || submission.loading}>
            <legend><PackageCheck size={18} /> Food information</legend>
            <label className="donation-field donation-field-full"><span>Food title <b>*</b></span><input name="title" placeholder="e.g. Fresh vegetable biryani" value={form.title} onChange={update} required /></label>
            <div className="donation-field-grid">
              <label className="donation-field"><span>Food type <b>*</b></span><select name="foodType" value={form.foodType} onChange={update}>
              <option value="cooked">Cooked</option><option value="raw">Raw</option><option value="packaged">Packaged</option><option value="bakery">Bakery</option><option value="produce">Produce</option><option value="mixed">Mixed</option>
              </select></label>
              <label className="donation-field"><span>Diet type <b>*</b></span><select name="dietType" value={form.dietType} onChange={update}>
              <option value="veg">Veg</option><option value="non-veg">Non-veg</option><option value="vegan">Vegan</option><option value="mixed">Mixed</option>
              </select></label>
              <label className="donation-field"><span>Quantity <b>*</b></span><input name="quantity" placeholder="e.g. 6 trays / 25 kg" value={form.quantity} onChange={update} required /></label>
              <label className="donation-field"><span>Estimated meals <b>*</b></span><input name="estimatedMeals" type="number" min="1" max="100000" value={form.estimatedMeals} onChange={update} required /></label>
              <label className="donation-field donation-field-full"><span>Intended distribution</span><select name="distributionTarget" value={form.distributionTarget} onChange={update}>
                <option value="families">Families</option><option value="shelters">Shelters</option><option value="schools">Schools</option><option value="old_age_homes">Old age homes</option><option value="orphanages">Orphanages</option><option value="community_kitchens">Community kitchens</option>
              </select></label>
            </div>
          </fieldset>

          <fieldset disabled={!canDonate || submission.loading}>
            <legend><MapPin size={18} /> Pickup and contact</legend>
            <label className="donation-field donation-field-full"><span>Pickup address <b>*</b></span><input name="pickupAddress" autoComplete="street-address" placeholder="Building, street and landmark" value={form.pickupAddress} onChange={update} required /></label>
            <div className="donation-field-grid">
              <label className="donation-field"><span>City <b>*</b></span><input name="city" autoComplete="address-level2" placeholder="City" value={form.city} onChange={update} required /></label>
              <label className="donation-field"><span>Contact number <b>*</b></span><div className="donation-input-icon"><Phone size={16} /><input name="contactNumber" type="tel" autoComplete="tel" placeholder="+91 98765 43210" value={form.contactNumber} onChange={update} required /></div></label>
            </div>
            <button className={pickupLocation ? 'donation-location-button active' : 'donation-location-button'} type="button" onClick={captureLocation}><LocateFixed size={17} /> {pickupLocation ? 'Location attached' : 'Attach precise pickup location'}</button>
            {locationStatus && <small className="donation-location-status">{locationStatus}</small>}
          </fieldset>

          <fieldset disabled={!canDonate || submission.loading}>
            <legend><Clock3 size={18} /> Timing and food safety</legend>
            <div className="donation-field-grid">
              <label className="donation-field"><span>Pickup starts <b>*</b></span><input name="pickupWindowStart" type="datetime-local" value={form.pickupWindowStart} onChange={update} required /></label>
              <label className="donation-field"><span>Pickup ends <b>*</b></span><input name="pickupWindowEnd" type="datetime-local" value={form.pickupWindowEnd} onChange={update} required /></label>
              <label className="donation-field donation-field-full"><span>Safe before <b>*</b></span><input name="safeBefore" type="datetime-local" value={form.safeBefore} onChange={update} required /></label>
              <label className="donation-field"><span>Storage instructions</span><textarea name="storageInstructions" placeholder="Keep refrigerated, insulated boxes..." value={form.storageInstructions} onChange={update} /></label>
              <label className="donation-field"><span>Allergen notes</span><textarea name="allergenNotes" placeholder="Contains dairy, wheat, nuts..." value={form.allergenNotes} onChange={update} /></label>
              <label className="donation-field donation-field-full"><span>Food photo URL</span><div className="donation-input-icon"><Camera size={16} /><input name="imageUrl" type="url" placeholder="https://example.com/food-photo.jpg" value={form.imageUrl} onChange={update} /></div></label>
            </div>
          </fieldset>

          {submission.message && <div className="donation-submit-status success"><CheckCircle2 size={20} /><span><strong>{submission.message}</strong>{submission.donationId && <small>Reference: {submission.donationId}</small>}</span></div>}
          {submission.error && <div className="donation-submit-status error" role="alert">{submission.error}</div>}
          <button className="donation-live-submit" disabled={!canDonate || submission.loading}>
            <UsersRound size={18} /> {submission.loading ? 'Posting donation...' : 'Post donation and notify nearby NGOs'}
          </button>
        </form>
      </section>
    </DetailPage>
    {authModal && <AuthModal {...authModal} onClose={() => setAuthModal(null)} />}
    </>
  );
}
