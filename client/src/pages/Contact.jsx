import { Mail, MapPin, Phone } from 'lucide-react';
import { DetailPage } from '../components/DetailPage.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function Contact() {
  const { t } = useLanguage();

  return (
    <DetailPage
      hero={{
        eyebrow: 'Contact',
        title: 'Talk to the FoodBridge coordination team',
        text: 'Use one support page for donors, NGOs, volunteers, recipients, and platform help.',
        tone: 'green',
        image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=85'
      }}
      navItems={[
        { id: 'support-email', label: 'Support email' },
        { id: 'partner-support', label: 'Partner support' },
        { id: 'emergency-assistance', label: 'Emergency help' }
      ]}
      sections={[
        {
          id: 'partner-support',
          title: 'Partner support for every role',
          image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1000&q=85',
          text: [
            'Donors can ask about posting surplus food, NGOs can ask about verification, volunteers can ask about pickup tasks, and recipients can ask about food support workflows.',
            'Clear requests help the coordination team route your issue to the right person.'
          ]
        },
        {
          id: 'emergency-assistance',
          title: 'Emergency coordination needs direct details',
          reverse: true,
          image: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1000&q=85',
          bullets: [
            'Share location, household size, urgency, and contact information.',
            'If food is already posted, include pickup window and safe-before time.',
            'For active delivery issues, include the donation title and assigned role.'
          ]
        }
      ]}
      values={[
        { title: 'Responsive', text: 'Support is organized by role and urgency.' },
        { title: 'Clear', text: 'The right details reduce back-and-forth.' },
        { title: 'Helpful', text: 'Contact pathways map to real platform workflows.' },
        { title: 'Human', text: 'People still matter behind every dashboard.' }
      ]}
    >
      <section className="detail-live-block detail-live-grid" id="support-email">
        <div>
          <h2>Contact details</h2>
          <div className="info-list contact-list">
            <p><Mail size={20} /> support@foodbridge.org</p>
            <p><Phone size={20} /> +91 98765 43210</p>
            <p><MapPin size={20} /> Community Food Coordination Center, India</p>
          </div>
        </div>
        <form className="contact-form form-panel">
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
      </section>
    </DetailPage>
  );
}
