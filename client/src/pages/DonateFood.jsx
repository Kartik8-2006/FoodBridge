import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function DonateFood() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
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

  if (!user) {
    return (
      <main className="section page-grid">
        <div>
          <p className="eyebrow">Donate Food</p>
          <h1>Please login as Donor</h1>
          <p>Food donation posting is protected so pickup teams can verify food source, pickup address, and safety details.</p>
          <div className="protected-actions">
            <Link className="button button-primary" to="/login">Login</Link>
            <Link className="button button-outline" to="/signup">Create Donor Account</Link>
          </div>
        </div>
        <div className="info-list">
          <h2>What donors can do</h2>
          <p>Post surplus cooked, packaged, grocery, bakery, and produce donations.</p>
          <p>Set pickup windows and safe-before times.</p>
          <p>Track accepted pickups and completed deliveries in the donor dashboard.</p>
        </div>
      </main>
    );
  }

  if (user.role !== 'donor' && user.role !== 'admin') {
    return (
      <main className="section page-grid">
        <div>
          <p className="eyebrow">Donate Food</p>
          <h1>Only donors can donate food</h1>
          <p>Your current role is <strong>{user.role}</strong>. Donation posting is limited to donor accounts so FoodBridge can maintain safe source tracking.</p>
          <div className="protected-actions">
            <Link className="button button-primary" to={`/dashboard/${user.role}`}>Go to Dashboard</Link>
            <Link className="button button-outline" to="/contact">Contact Support</Link>
          </div>
        </div>
        <div className="info-list">
          <h2>Role guidance</h2>
          <p>NGOs can accept donations from their dashboard.</p>
          <p>Volunteers can accept nearby pickup tasks.</p>
          <p>Recipients can request assistance from the recipient dashboard.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="section page-grid">
      <div>
        <p className="eyebrow">Donate Food</p>
        <h1>Post surplus food before the pickup window closes</h1>
        <p>Share clear quantity, timing, handling, and allergy details so verified partners can move quickly.</p>
      </div>
      <form className="form-panel" onSubmit={submit}>
        {!user && <div className="notice">Create a donor account or login before submitting a live donation.</div>}
        <input name="title" placeholder="Food title" value={form.title} onChange={update} required />
        <div className="two-col">
          <select name="foodType" value={form.foodType} onChange={update}>
            <option value="cooked">Cooked</option><option value="raw">Raw</option><option value="packaged">Packaged</option><option value="bakery">Bakery</option><option value="produce">Produce</option><option value="mixed">Mixed</option>
          </select>
          <select name="dietType" value={form.dietType} onChange={update}>
            <option value="veg">Veg</option><option value="non-veg">Non-veg</option><option value="vegan">Vegan</option><option value="mixed">Mixed</option>
          </select>
        </div>
        <div className="two-col">
          <input name="quantity" placeholder="Quantity, e.g. 6 trays" value={form.quantity} onChange={update} required />
          <input name="estimatedMeals" type="number" min="1" placeholder="Estimated meals" value={form.estimatedMeals} onChange={update} required />
        </div>
        <input name="pickupAddress" placeholder="Pickup address" value={form.pickupAddress} onChange={update} required />
        <input name="city" placeholder="City" value={form.city} onChange={update} required />
        <div className="two-col">
          <label>Pickup starts<input name="pickupWindowStart" type="datetime-local" value={form.pickupWindowStart} onChange={update} required /></label>
          <label>Pickup ends<input name="pickupWindowEnd" type="datetime-local" value={form.pickupWindowEnd} onChange={update} required /></label>
        </div>
        <label>Safe before<input name="safeBefore" type="datetime-local" value={form.safeBefore} onChange={update} required /></label>
        <textarea name="storageInstructions" placeholder="Storage instructions" value={form.storageInstructions} onChange={update} />
        <textarea name="allergenNotes" placeholder="Allergen notes" value={form.allergenNotes} onChange={update} />
        {message && <div className="notice">{message}</div>}
        <button className="button button-primary">Post Donation</button>
      </form>
    </main>
  );
}
