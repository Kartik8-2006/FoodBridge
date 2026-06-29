import { Link } from 'react-router-dom';

export default function Volunteer() {
  return (
    <main className="section page-grid">
      <div>
        <p className="eyebrow">Volunteer</p>
        <h1>Move food quickly, safely, and locally</h1>
        <p>Volunteers help FoodBridge complete time-sensitive pickups, confirm handling details, and support NGOs with last-mile distribution.</p>
        <Link className="button button-primary" to="/signup">Join as Volunteer</Link>
      </div>
      <div className="info-list">
        <h2>Volunteer responsibilities</h2>
        <p>Accept nearby pickup tasks based on your availability and transport capacity.</p>
        <p>Confirm pickup proof and update delivery status inside your dashboard.</p>
        <p>Follow safe food handling guidance and partner instructions for each donation.</p>
      </div>
    </main>
  );
}
