import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, ChevronDown, CircleDollarSign, Heart, HeartHandshake, LockKeyhole, LogIn, LogOut, Menu, Search, ShieldCheck, ShoppingCart, UserCircle, UserPlus, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { dashboardPath } from '../utils.js';

const links = [
  { label: 'Home', path: '/', items: [['Our story', '/'], ['Impact facts', '/'], ['Latest updates', '/resources']] },
  { label: 'Donate Food', path: '/donate-food', items: [['Post food availability', '/donate-food'], ['Donation guidelines', '/resources'], ['Food safety checklist', '/resources'], ['Pickup preparation', '/how-it-works']] },
  { label: 'Find Food', path: '/find-food', items: [['Available food', '/find-food'], ['Request food support', '/find-food'], ['Nearby distribution points', '/find-food'], ['Emergency assistance', '/contact']] },
  { label: 'Become Volunteer', path: '/volunteer', items: [['Volunteer signup', '/volunteer'], ['Nearby pickups', '/volunteer'], ['Assigned deliveries', '/volunteer'], ['Completed deliveries', '/volunteer']] },
  { label: 'NGOs', path: '/ngos', items: [['NGO registration', '/signup'], ['Available donations', '/ngos'], ['Beneficiaries', '/resources'], ['Verification process', '/resources']] },
  { label: 'Resources', path: '/resources', items: [['Food safety', '/resources'], ['Donor handbook', '/resources'], ['Volunteer guide', '/resources'], ['Reports', '/resources']] },
  { label: 'About', path: '/about', items: [['Project objective', '/about'], ['How it works', '/how-it-works'], ['Our mission', '/about']] },
  { label: 'Contact', path: '/contact', items: [['Support email', '/contact'], ['Partner support', '/contact'], ['Emergency coordination', '/contact']] }
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [donationOpen, setDonationOpen] = useState(false);
  const [authModal, setAuthModal] = useState(null);

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
            {/* <span className="feeding-mark">MEMBER OF<br />COMMUNITY FOOD RELIEF</span> */}
          </Link>

          <div className="top-nav-center">
            {/* <span><strong>English</strong> / Hindi</span> */}
            <Search size={30} strokeWidth={2.6} />
          </div>

          <div className="utility-actions">
            <Link className="utility-find" to="/find-food"><ShoppingCart size={24} /> Find Food</Link>
            <button className="utility-donate" type="button" onClick={() => setDonationOpen(true)}><CircleDollarSign size={23} /> Donate Now!</button>
            {user ? (
              <>
                <button className="notification-button" type="button" aria-label="Notifications"><Bell size={20} /><span>3</span></button>
                <Link className="utility-dashboard" to={dashboardPath(user.role)}><UserCircle size={20} /> Dashboard</Link>
                <div className="profile-menu">
                  <button className="profile-trigger" type="button">
                    <span className="profile-avatar">{user.name?.charAt(0) || 'U'}</span>
                    Profile <ChevronDown size={15} />
                  </button>
                  <div className="profile-dropdown">
                    <Link to={dashboardPath(user.role)}>My Dashboard</Link>
                    <Link to={dashboardPath(user.role)}>Profile Settings</Link>
                    <button type="button" onClick={logout}><LogOut size={16} /> Logout</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <button className="utility-login" type="button" onClick={() => setAuthModal('login')}><LogIn size={18} /> Login</button>
                <button className="utility-signup" type="button" onClick={() => setAuthModal('signup')}><UserPlus size={18} /> Sign Up</button>
              </>
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
        <span>TRIPLE Your Gift for Local Families!</span>
        <Heart size={18} fill="currentColor" />
      </Link>
      {children}
      {donationOpen && <DonationModal onClose={() => setDonationOpen(false)} />}
      {authModal && <AuthModal initialMode={authModal} onClose={() => setAuthModal(null)} />}
      <footer className="footer foodbank-footer">
        <div className="seed-border" />
        <section className="footer-newsletter">
          <h2>Stay Up To Date</h2>
          <form>
            <div className="footer-name-row">
              <input placeholder="First name" />
              <input placeholder="Last name" />
            </div>
            <input placeholder="Phone Number" />
            <div className="footer-email-row">
              <input placeholder="Email" />
              <button>Subscribe</button>
            </div>
          </form>
        </section>
        <section className="footer-contact">
          <div className="footer-logo brand">
            <span className="brand-symbol"><HeartHandshake size={34} /></span>
            <span className="brand-type"><small>FOODBRIDGE</small><strong>NETWORK</strong></span>
          </div>
          <div>
            <strong>Call Us</strong>
            <p>+91 98765 43210</p>
            <strong>FoodBridge Network</strong>
            <p>Community Food Coordination Center, India</p>
          </div>
          <div>
            <strong>Registry:</strong>
            <p>Verified NGO and donor coordination platform</p>
            <strong>Email Us</strong>
            <p>support@foodbridge.org</p>
          </div>
          <Link className="footer-contact-btn" to="/about">Contact Us</Link>
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
      navigate(dashboardPath(user.role));
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
