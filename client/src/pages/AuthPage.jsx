import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { dashboardPath } from '../utils.js';

const roles = ['donor', 'ngo', 'volunteer', 'recipient'];

export default function AuthPage({ mode }) {
  const isSignup = mode === 'signup';
  const { login, register } = useAuth();
  const navigate = useNavigate();
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
      navigate(dashboardPath(user.role));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">{isSignup ? 'Create Account' : 'Welcome Back'}</p>
        <h1>{isSignup ? 'Join FoodBridge Network' : 'Log in to your dashboard'}</h1>
        <form onSubmit={submit} className="form-grid">
          {isSignup && <input name="name" placeholder="Full name or organization contact" value={form.name} onChange={update} required />}
          <input name="email" type="email" placeholder="Email address" value={form.email} onChange={update} required />
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={update} required />
          {isSignup && (
            <>
              <select name="role" value={form.role} onChange={update}>{roles.map((role) => <option key={role} value={role}>{role}</option>)}</select>
              <input name="organizationName" placeholder="Organization or household name" value={form.organizationName} onChange={update} />
              <input name="city" placeholder="City" value={form.city} onChange={update} required />
              <input name="phone" placeholder="Phone number" value={form.phone} onChange={update} required />
              <input name="address" placeholder="Address or service area" value={form.address} onChange={update} />
            </>
          )}
          {error && <div className="error">{error}</div>}
          <button className="button button-primary">{isSignup ? 'Create Account' : 'Login'}</button>
        </form>
      </section>
    </main>
  );
}
