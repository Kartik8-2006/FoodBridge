import { useState } from 'react';
import { Link } from 'react-router-dom';
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
  const [message, setMessage] = useState('');
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    foodType: 'cooked',
    dietType: 'veg',
    quantity: '',
    estimatedMeals: 20,
    pickupAddress: '',
    city: '',
    pickupWindowStart: '',
    pickupWindowEnd: '',
    safeBefore: '',
    storageInstructions: '',
    allergenNotes: ''
  });

  function update(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    setMessage('');
    try {
      await api('/donations', { method: 'POST', body: JSON.stringify(form) });
      setMessage('Donation posted. NGOs and volunteers have been notified.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  const canDonate = user && (user.role === 'donor' || user.role === 'admin');

  return (
    <>
    <DetailPage
      onAction={(action) => action === 'register-donor' && setRegistrationOpen(true)}
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
      <section className="detail-live-block detail-live-grid" id="donate-food-section">
        <div>
          <p className="eyebrow">Live donation form</p>
          <h2>Post surplus food before the pickup window closes</h2>
          <p className="lead">Share clear quantity, timing, handling, and allergy details so verified partners can move quickly.</p>
          {!user && (
            <div className="protected-actions">
              <Link className="button button-primary" to="/login">Login</Link>
              <Link className="button button-outline" to="/signup">Create Donor Account</Link>
            </div>
          )}
          {user && !canDonate && <div className="notice">Your current role is {user.role}. Donation posting is limited to donor accounts.</div>}
        </div>
        <form className="form-panel" onSubmit={submit}>
          {!canDonate && <div className="notice">Create or login with a donor account before submitting a live donation.</div>}
          <input name="title" placeholder="Food title" value={form.title} onChange={update} required disabled={!canDonate} />
          <div className="two-col">
            <select name="foodType" value={form.foodType} onChange={update} disabled={!canDonate}>
              <option value="cooked">Cooked</option><option value="raw">Raw</option><option value="packaged">Packaged</option><option value="bakery">Bakery</option><option value="produce">Produce</option><option value="mixed">Mixed</option>
            </select>
            <select name="dietType" value={form.dietType} onChange={update} disabled={!canDonate}>
              <option value="veg">Veg</option><option value="non-veg">Non-veg</option><option value="vegan">Vegan</option><option value="mixed">Mixed</option>
            </select>
          </div>
          <div className="two-col">
            <input name="quantity" placeholder="Quantity, e.g. 6 trays" value={form.quantity} onChange={update} required disabled={!canDonate} />
            <input name="estimatedMeals" type="number" min="1" placeholder="Estimated meals" value={form.estimatedMeals} onChange={update} required disabled={!canDonate} />
          </div>
          <input name="pickupAddress" placeholder="Pickup address" value={form.pickupAddress} onChange={update} required disabled={!canDonate} />
          <input name="city" placeholder="City" value={form.city} onChange={update} required disabled={!canDonate} />
          <div className="two-col">
            <label>Pickup starts<input name="pickupWindowStart" type="datetime-local" value={form.pickupWindowStart} onChange={update} required disabled={!canDonate} /></label>
            <label>Pickup ends<input name="pickupWindowEnd" type="datetime-local" value={form.pickupWindowEnd} onChange={update} required disabled={!canDonate} /></label>
          </div>
          <label>Safe before<input name="safeBefore" type="datetime-local" value={form.safeBefore} onChange={update} required disabled={!canDonate} /></label>
          <textarea name="storageInstructions" placeholder="Storage instructions" value={form.storageInstructions} onChange={update} disabled={!canDonate} />
          <textarea name="allergenNotes" placeholder="Allergen notes" value={form.allergenNotes} onChange={update} disabled={!canDonate} />
          {message && <div className="notice">{message}</div>}
          <button className="button button-primary" disabled={!canDonate}>Post Donation</button>
        </form>
      </section>
    </DetailPage>
    {registrationOpen && <AuthModal initialMode="signup" initialRole="donor" lockRole onClose={() => setRegistrationOpen(false)} />}
    </>
  );
}
