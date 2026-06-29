import { Mail, MapPin, Phone } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function Contact() {
  const { t } = useLanguage();
  return (
    <main className="section page-grid">
      <div id="partner-support">
        <p className="eyebrow">{t("Contact")}</p>
        <h1>{t("Talk to the FoodBridge coordination team")}</h1>
        <p>{t("Use this page for donor support, NGO verification, volunteer coordination, recipient assistance, and platform help.")}</p>
      </div>
      <div className="info-list contact-list">
        <p id="support-email"><Mail size={20} /> support@foodbridge.org</p>
        <p id="emergency-assistance"><Phone size={20} /> +91 98765 43210</p>
        <p><MapPin size={20} /> Community Food Coordination Center, India</p>
        <form className="contact-form">
          <input placeholder={t("Full name")} />
          <input placeholder={t("Email address")} />
          <select defaultValue="">
            <option value="" disabled>{t("Reason for contact")}</option>
            <option>{t("Donor support")}</option>
            <option>{t("NGO verification")}</option>
            <option>{t("Volunteer coordination")}</option>
            <option>{t("Recipient assistance")}</option>
          </select>
          <textarea placeholder={t("How can we help?")} />
          <button type="button">{t("Send Message")}</button>
        </form>
      </div>
    </main>
  );
}
