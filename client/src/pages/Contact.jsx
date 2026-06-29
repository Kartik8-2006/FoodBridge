import { Mail, MapPin, Phone } from 'lucide-react';

export default function Contact() {
  return (
    <main className="section page-grid">
      <div>
        <p className="eyebrow">Contact</p>
        <h1>Talk to the FoodBridge coordination team</h1>
        <p>Use this page for donor support, NGO verification, volunteer coordination, recipient assistance, and platform help.</p>
      </div>
      <div className="info-list contact-list">
        <p><Mail size={20} /> support@foodbridge.org</p>
        <p><Phone size={20} /> +91 98765 43210</p>
        <p><MapPin size={20} /> Community Food Coordination Center, India</p>
        <form className="contact-form">
          <input placeholder="Full name" />
          <input placeholder="Email address" />
          <select defaultValue="">
            <option value="" disabled>Reason for contact</option>
            <option>Donor support</option>
            <option>NGO verification</option>
            <option>Volunteer coordination</option>
            <option>Recipient assistance</option>
          </select>
          <textarea placeholder="How can we help?" />
          <button>Send Message</button>
        </form>
      </div>
    </main>
  );
}
