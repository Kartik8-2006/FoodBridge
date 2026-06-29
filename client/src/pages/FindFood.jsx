import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { formatDate, titleCase } from '../utils.js';

export default function FindFood() {
  const [donations, setDonations] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('foodbridge_token');
    if (!token) return;
    api('/donations')
      .then((data) => setDonations(data.donations))
      .catch((error) => setMessage(error.message));
  }, []);

  return (
    <main className="section">
      <p className="eyebrow">Find Food</p>
      <h1>Food support and active donation availability</h1>
      <p className="lead">Recipients can request assistance, while NGOs and volunteers can view nearby donations after login.</p>
      {!localStorage.getItem('foodbridge_token') && <div className="notice">Login as an NGO, volunteer, or recipient to view live availability.</div>}
      {message && <div className="notice">{message}</div>}
      <div className="card-grid">
        {donations.map((donation) => (
          <article className="data-card" key={donation._id}>
            <span className="status">{titleCase(donation.status)}</span>
            <h3>{donation.title}</h3>
            <p>{donation.quantity} supporting about {donation.estimatedMeals} meals in {donation.city}.</p>
            <small>Safe before {formatDate(donation.safeBefore)}</small>
          </article>
        ))}
      </div>
    </main>
  );
}
