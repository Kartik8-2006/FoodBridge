import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, ChevronDown, CircleDollarSign, Heart, HeartHandshake, LockKeyhole, LogIn, LogOut, Menu, ShieldCheck, ShoppingCart, UserCircle, UserPlus, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../api.js';
import { dashboardPath } from '../utils.js';
import SearchInput from './SearchInput.jsx';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [donationOpen, setDonationOpen] = useState(false);
  const [authModal, setAuthModal] = useState(null);
  const [newsletter, setNewsletter] = useState({ firstName: '', lastName: '', phone: '', email: '' });
  const [newsletterMessage, setNewsletterMessage] = useState('');

  const links = [
    { label: t('HOME'), path: '/', items: [[t('Our story'), '/#our-story'], [t('Impact facts'), '/#impact-facts'], [t('Latest updates'), '/#latest-updates']] },
    { label: t('DONATE FOOD'), path: '/donate-food', items: [[t('Donate funds'), '/donate-food#donate-funds'], [t('Donate food'), '/donate-food#donate-food-section'], [t('Food safety checklist'), '/donate-food#food-safety'], [t('Pickup preparation'), '/donate-food#pickup-preparation']] },
    { label: t('FIND FOOD'), path: '/find-food', items: [[t('Available food'), '/find-food#available-food'], [t('Request food support'), '/find-food#request-food'], [t('Nearby distribution points'), '/find-food#distribution-points'], [t('Emergency assistance'), '/find-food#emergency-assistance']] },
    { label: t('BECOME VOLUNTEER'), path: '/volunteer', items: [[t('Volunteer signup'), '/volunteer#volunteer-signup'], [t('Nearby pickups'), '/volunteer#nearby-pickups'], [t('Assigned deliveries'), '/volunteer#assigned-deliveries'], [t('Completed deliveries'), '/volunteer#completed-deliveries']] },
    { label: t('NGOS'), path: '/ngos', items: [[t('NGO registration'), '/ngos#ngo-registration'], [t('Available donations'), '/ngos#ngo-donations'], [t('Beneficiaries'), '/ngos#beneficiaries'], [t('Verification process'), '/ngos#ngo-verification']] },
    { label: t('RESOURCES'), path: '/resources', items: [[t('Food safety'), '/resources#food-safety'], [t('Donor handbook'), '/resources#donor-handbook'], [t('Volunteer guide'), '/resources#volunteer-guide'], [t('Reports'), '/resources#reports-section']] },
    { label: t('ABOUT'), path: '/about', items: [[t('Project objective'), '/about#project-objective'], [t('How it works'), '/about#how-platform-works'], [t('Our mission'), '/about#our-mission']] },
    { label: t('CONTACT'), path: '/contact', items: [[t('Support email'), '/contact#support-email'], [t('Partner support'), '/contact#partner-support'], [t('Emergency coordination'), '/contact#emergency-assistance']] }
  ];

  function updateNewsletter(event) {
    setNewsletter({ ...newsletter, [event.target.name]: event.target.value });
  }

  async function submitNewsletter(event) {
    event.preventDefault();
    setNewsletterMessage('');
    try {
      const data = await api('/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify(newsletter)
      });
      setNewsletter({ firstName: '', lastName: '', phone: '', email: '' });
      setNewsletterMessage(data.message || 'Subscribed successfully.');
    } catch (err) {
      setNewsletterMessage(err.message);
    }
  }

  return (
    <>
      <header className="site-header">
        <div className="top-nav">
          <Link className="brand" to="/">
            <span className="brand-symbol"><HeartHandshake size={32} /></span>
            <span className="brand-type">
              <small>FOODBRIDGE</small>
              <strong>NETWORK</strong>
            </span>
          </Link>

          <div className="top-nav-center">
            <div className="language-selector">
              <button 
                type="button" 
                className={language === 'en' ? 'lang-btn active' : 'lang-btn'}
                onClick={() => setLanguage('en')}
              >
                English
              </button>
              <span className="lang-separator">/</span>
              <button 
                type="button" 
                className={language === 'hi' ? 'lang-btn active' : 'lang-btn'}
                onClick={() => setLanguage('hi')}
              >
                हिंदी
              </button>
            </div>
            <SearchInput />
          </div>

          <div className="utility-actions">
            <Link className="utility-find" to="/find-food"><ShoppingCart size={24} /> {t("FIND FOOD")}</Link>
            <button className="utility-donate" type="button" onClick={() => setAuthModal('signup')}><CircleDollarSign size={23} /> {t("DONATE FOOD")}</button>
            {user ? (
              <>
                <Link className="utility-dashboard" to={dashboardPath(user.role)}><UserCircle size={20} /> {t("DASHBOARD")}</Link>
                <button className="notification-button" type="button" aria-label="Notifications"><Bell size={20} /><span>3</span></button>
                <div className="profile-menu">
                  <button className="profile-trigger" type="button">
                    <span className="profile-avatar">{user.name?.charAt(0) || 'U'}</span>
                    <ChevronDown size={15} />
                  </button>
                  <div className="profile-dropdown">
                    <Link to={dashboardPath(user.role)}>{t("MY DASHBOARD")}</Link>
                    <Link to={dashboardPath(user.role)}>{t("PROFILE SETTINGS")}</Link>
                    <button type="button" onClick={logout}><LogOut size={16} /> {t("LOGOUT")}</button>
                  </div>
                </div>
              </>
            ) : (
              null
            )}
          </div>
        </div>

        <div className="primary-nav">
          <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Open navigation">
            {open ? <X /> : <Menu />}
          </button>

          <nav className={open ? 'nav-links open' : 'nav-links'}>
            {links.map((item) => (
              <div className={item.items ? 'nav-item has-dropdown' : 'nav-item'} key={item.path + item.label}>
                <NavLink to={item.path} onClick={() => setOpen(false)}>
                  <span>{item.label}</span>
                  {item.items && <ChevronDown size={16} fill="currentColor" />}
                </NavLink>
                {item.items && (
                  <div className="nav-dropdown">
                    {item.items.map(([label, path]) => (
                      <Link key={label} to={path} onClick={() => setOpen(false)}>{label}</Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </header>
      <Link className="gift-tab" to="/signup">
        <span>{t("TRIPLE YOUR GIFT FOR LOCAL FAMILIES!")}</span>
        <Heart size={18} fill="currentColor" />
      </Link>
      {children}
      {donationOpen && <DonationModal onClose={() => setDonationOpen(false)} />}
      {authModal && <AuthModal initialMode={authModal} onClose={() => setAuthModal(null)} />}
      <footer className="footer foodbank-footer">
        <section className="footer-newsletter">
          <h2>{t("STAY UP TO DATE")}</h2>
          <form onSubmit={submitNewsletter}>
            <div className="footer-name-row">
              <input name="firstName" placeholder={t("FIRST NAME")} value={newsletter.firstName} onChange={updateNewsletter} />
              <input name="lastName" placeholder={t("LAST NAME")} value={newsletter.lastName} onChange={updateNewsletter} />
            </div>
            <input name="phone" placeholder={t("PHONE NUMBER")} value={newsletter.phone} onChange={updateNewsletter} />
            <div className="footer-email-row">
              <input name="email" type="email" placeholder={t("EMAIL")} value={newsletter.email} onChange={updateNewsletter} required />
              <button type="submit">{t("SUBSCRIBE")}</button>
            </div>
            {newsletterMessage && <div className="footer-newsletter-message">{newsletterMessage}</div>}
          </form>
        </section>
        <section className="footer-contact">
          <div className="footer-logo brand">
            <span className="brand-symbol"><HeartHandshake size={34} /></span>
            <span className="brand-type"><small>FOODBRIDGE</small><strong>NETWORK</strong></span>
          </div>
          <div>
            <strong>{t("CALL US")}</strong>
            <p>+91 98765 43210</p>
            <strong>FoodBridge Network</strong>
            <p>Community Food Coordination Center, India</p>
          </div>
          <div>
            <strong>Registry:</strong>
            <p>Verified NGO and donor coordination platform</p>
            <strong>{t("EMAIL US")}</strong>
            <p>support@foodbridge.org</p>
          </div>
          <Link className="footer-contact-btn" to="/about">{t("CONTACT US")}</Link>
        </section>
      </footer>
    </>
  );
}

function DonationModal({ onClose }) {
  const [frequency, setFrequency] = useState('monthly');
  const [amount, setAmount] = useState(7000);
  const amounts = [40000, 20000, 7000, 5000, 3500, 2000];

  return (
    <div className="donation-overlay" role="dialog" aria-modal="true" aria-labelledby="donation-title">
      <button className="donation-close" type="button" aria-label="Close donation form" onClick={onClose}><X size={24} /></button>
      <section className="donation-modal">
        <div className="donation-story">
          <div className="donation-photo" />
          <div className="donation-brand">
            <span className="brand-symbol"><HeartHandshake size={28} /></span>
            <span className="brand-type"><small>FOODBRIDGE</small><strong>NETWORK</strong></span>
          </div>
          <h2>You Will Make a Difference</h2>
          <p>Help us move surplus food quickly and safely. Every rupee supports pickup coordination, storage, and verified community distribution.</p>
          <p>Prefer to donate food instead? You can post a pickup-ready donation from your donor dashboard after signup.</p>
        </div>
        <form className="donation-form">
          <div className="secure-title">
            <ShieldCheck size={28} />
            <h2 id="donation-title">Secure donation</h2>
          </div>
          <div className="frequency-toggle">
            {['once', 'monthly'].map((item) => (
              <button className={frequency === item ? 'selected' : ''} type="button" key={item} onClick={() => setFrequency(item)}>
                {item === 'monthly' && <Heart size={16} fill="currentColor" />}
                {item === 'once' ? 'Give once' : 'Monthly'}
              </button>
            ))}
          </div>
          <div className="amount-grid">
            {amounts.map((value) => (
              <button className={amount === value ? 'selected' : ''} type="button" key={value} onClick={() => setAmount(value)}>
                Rs {value.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
          <label className="amount-input">
            <input value={`Rs ${amount.toLocaleString('en-IN')}`} readOnly />
            <span>INR <ChevronDown size={16} /></span>
          </label>
          <label className="dedicate-check">
            <input type="checkbox" />
            <span>Dedicate this donation</span>
          </label>
          <div className="donation-assurance">
            <CheckCircle2 size={17} />
            <span>Encrypted checkout. Receipts are sent by email.</span>
          </div>
          <button className="donation-submit" type="button">
            <LockKeyhole size={18} />
            Donate {frequency === 'monthly' ? 'monthly' : 'now'}
          </button>
        </form>
      </section>
    </div>
  );
}

function AuthModal({ initialMode, onClose }) {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'donor',
    organizationName: '',
    city: '',
    phone: '',
    address: ''
  });
  const isSignup = mode === 'signup';

  function update(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      const user = isSignup
        ? await register({
            name: form.name,
            email: form.email,
            password: form.password,
            role: form.role,
            profile: {
              organizationName: form.organizationName,
              city: form.city,
              phone: form.phone,
              address: form.address,
              serviceArea: form.city,
              foodSourceType: 'event'
            }
          })
        : await login(form.email, form.password);
      onClose();
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="donation-overlay" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button className="donation-close" type="button" aria-label="Close login form" onClick={onClose}><X size={24} /></button>
      <section className="donation-modal auth-modal">
        <div className="donation-story auth-story">
          <div className="auth-photo" />
          <div className="donation-brand">
            <span className="brand-symbol"><HeartHandshake size={28} /></span>
            <span className="brand-type"><small>FOODBRIDGE</small><strong>NETWORK</strong></span>
          </div>
          <h2>{isSignup ? 'Join the food rescue network' : 'Welcome back to your workspace'}</h2>
          <p>One account connects donors, NGOs, volunteers, recipients, and admins through a dedicated dashboard for donation posting, pickup scheduling, tracking, and notifications.</p>
          <div className="auth-benefits">
            <span><CheckCircle2 size={16} /> Post surplus food</span>
            <span><CheckCircle2 size={16} /> Coordinate pickups</span>
            <span><CheckCircle2 size={16} /> Track distribution</span>
          </div>
        </div>
        <form className="donation-form auth-form" onSubmit={submit}>
          <div className="secure-title">
            {isSignup ? <UserPlus size={28} /> : <ShieldCheck size={28} />}
            <h2 id="auth-title">{isSignup ? 'Create account' : 'Login securely'}</h2>
          </div>
          <div className="frequency-toggle auth-toggle">
            <button className={!isSignup ? 'selected' : ''} type="button" onClick={() => setMode('login')}>Login</button>
            <button className={isSignup ? 'selected' : ''} type="button" onClick={() => setMode('signup')}>Sign Up</button>
          </div>
          <div className="auth-field-grid">
            {isSignup && <input name="name" placeholder="Full name or contact person" value={form.name} onChange={update} required />}
            <input name="email" type="email" placeholder="Email address" value={form.email} onChange={update} required />
            <input name="password" type="password" placeholder="Password" value={form.password} onChange={update} required />
            {isSignup && (
              <>
                <select name="role" value={form.role} onChange={update}>
                  <option value="donor">Donor</option>
                  <option value="ngo">NGO</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="recipient">Recipient</option>
                </select>
                <input name="organizationName" placeholder="Organization or household name" value={form.organizationName} onChange={update} />
                <input name="city" placeholder="City" value={form.city} onChange={update} required />
                <input name="phone" placeholder="Phone number" value={form.phone} onChange={update} required />
                <input name="address" placeholder="Address or service area" value={form.address} onChange={update} />
              </>
            )}
          </div>
          {!isSignup && <Link className="forgot-password-link" to="/forgot-password" onClick={onClose}>Forgot password?</Link>}
          {error && <div className="error">{error}</div>}
          <div className="donation-assurance">
            <LockKeyhole size={17} />
            <span>After login, your separate dashboard page opens automatically.</span>
          </div>
          <button className="donation-submit" type="submit">
            {isSignup ? <UserPlus size={18} /> : <LogIn size={18} />}
            {isSignup ? 'Create account' : 'Login to dashboard'}
          </button>
        </form>
      </section>
    </div>
  );
}
