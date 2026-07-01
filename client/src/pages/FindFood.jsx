import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { DetailPage } from '../components/DetailPage.jsx';
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
    <DetailPage
      hero={{
        eyebrow: 'Find Food',
        title: 'Connect families with safe food support',
        text: 'Recipients, NGOs, and volunteers use FoodBridge to locate available donations and request timely assistance.',
        tone: 'green',
        image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1400&q=85'
      }}
      navItems={[
        { id: 'available-food', label: 'Available food' },
        { id: 'request-food', label: 'Request support' },
        { id: 'distribution-points', label: 'Distribution points' },
        { id: 'emergency-assistance', label: 'Emergency assistance' }
      ]}
      sections={[
        {
          id: 'request-food',
          title: 'Request food support with dignity',
          image: 'https://images.unsplash.com/photo-1599059813005-11265ba4b4ce?auto=format&fit=crop&w=1000&q=85',
          text: [
            'Recipient accounts can submit household size, location, need, and urgency from the dashboard. The platform keeps the request focused on only the information partners need to respond.',
            'FoodBridge helps route support through verified NGOs and community teams instead of exposing personal details publicly.'
          ]
        },
        {
          id: 'distribution-points',
          title: 'Nearby distribution partners coordinate handoff',
          reverse: true,
          image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1000&q=85',
          bullets: [
            'NGOs review available donations that match their service area.',
            'Volunteers help with pickup and last-mile delivery when needed.',
            'Recipients receive support through organized and accountable partners.'
          ]
        },
        {
          id: 'emergency-assistance',
          title: 'Emergency help needs clear timing',
          image: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1000&q=85',
          text: [
            'Urgent requests are easier to coordinate when the location, number of people, dietary limitations, and availability window are clear.',
            'For immediate coordination, recipients can contact the FoodBridge support team while their dashboard request is reviewed.'
          ]
        }
      ]}
      values={[
        { title: 'Privacy', text: 'Only necessary support details are collected.' },
        { title: 'Access', text: 'Food availability is connected to nearby partners.' },
        { title: 'Clarity', text: 'Urgency and location help teams respond faster.' },
        { title: 'Care', text: 'The workflow is designed around dignity.' }
      ]}
    >
      <section className="detail-live-block" id="available-food">
        <h2>Active donation availability</h2>
        {!localStorage.getItem('foodbridge_token') && <div className="notice">Login as an NGO, volunteer, or recipient to view live availability.</div>}
        {message && <div className="notice">{message}</div>}
        <div className="card-grid">
          {donations.length === 0 && <article className="data-card"><h3>No live list shown</h3><p>Login to load real-time available food from the FoodBridge database.</p></article>}
          {donations.map((donation) => (
            <article className="data-card" key={donation._id}>
              <span className="status">{titleCase(donation.status)}</span>
              <h3>{donation.title}</h3>
              <p>{donation.quantity} supporting about {donation.estimatedMeals} meals in {donation.city}.</p>
              <small>Safe before {formatDate(donation.safeBefore)}</small>
            </article>
          ))}
        </div>
      </section>
    </DetailPage>
  );
}
