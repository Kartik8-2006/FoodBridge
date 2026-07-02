import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { dashboardPath } from '../utils.js';

const roles = ['donor', 'ngo', 'volunteer', 'recipient'];

export default function AuthPage({ mode }) {
  const isSignup = mode === 'signup';
  const isForgot = mode === 'forgot';
  const isReset = mode === 'reset';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
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
    setMessage('');
    try {
      if (isForgot) {
        const data = await api('/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email: form.email })
        });
        setMessage(data.message);
        return;
      }

      if (isReset) {
        if (!searchParams.get('token')) throw new Error('This reset link is incomplete. Request a new one.');
        if (form.password.length < 8) throw new Error('Password must be at least 8 characters.');
        if (form.password !== form.confirmPassword) throw new Error('Passwords do not match.');
        const data = await api('/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ token: searchParams.get('token'), password: form.password })
        });
        setMessage(data.message);
        setForm((current) => ({ ...current, password: '', confirmPassword: '' }));
        return;
      }

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
        <p className="eyebrow">{isSignup ? 'Create Account' : isForgot ? 'Password Help' : isReset ? 'Reset Password' : 'Welcome Back'}</p>
        <h1>{isSignup ? 'Join FoodBridge Network' : isForgot ? 'Get a reset link' : isReset ? 'Create a new password' : 'Log in to your dashboard'}</h1>
        <form onSubmit={submit} className="form-grid">
          {isSignup && <input name="name" placeholder="Full name or organization contact" value={form.name} onChange={update} required />}
          {!isReset && <input name="email" type="email" placeholder="Email address" value={form.email} onChange={update} required />}
          {!isForgot && <input name="password" type="password" placeholder={isReset ? 'New password' : 'Password'} value={form.password} onChange={update} required />}
          {isReset && <input name="confirmPassword" type="password" placeholder="Confirm new password" value={form.confirmPassword} onChange={update} required />}
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
          {message && <div className="notice">{message}</div>}
          <button className="button button-primary">{isSignup ? 'Create Account' : isForgot ? 'Send reset link' : isReset ? 'Reset password' : 'Login'}</button>
          {!isSignup && !isForgot && !isReset && <Link className="forgot-password-link" to="/forgot-password">Forgot password?</Link>}
          {(isForgot || isReset) && <Link className="forgot-password-link" to="/login">Back to login</Link>}
        </form>
      </section>
    </main>
  );
}
