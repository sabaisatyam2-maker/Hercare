import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { AuthLayout } from '../components/AuthLayout';
import { FormField } from '../components/FormField';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { getErrorMessage } from '../utils/format';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resend, setResend] = useState({ message: '', status: '' });

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(''); setNeedsVerification(false); setResend({ message: '', status: '' });
    if (!form.email.trim() || !form.password) { setError('Email and password are required.'); return; }
    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      // GuestRoute redirects to the right page as soon as the user is set.
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed.'));
      if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED') setNeedsVerification(true);
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (cooldown > 0) return;
    setCooldown(30);
    try {
      const { data } = await api.post('/auth/resend-verification', { email: form.email.trim() });
      setResend({ message: data.message || 'Verification email sent.', status: 'success' });
      setError('');
    } catch (err) {
      setResend({ message: getErrorMessage(err, 'Could not resend the email.'), status: 'error' });
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to continue your wellness journey.">
      <Alert type="error">{error}</Alert>
      {needsVerification && (
        <div className="mb-5 bg-rose-50 p-4 rounded-xl border border-rose-100 flex flex-col items-center gap-2">
          <p className="text-sm text-rose-700 text-center">Your email is not verified yet.</p>
          <Button variant="outline" size="sm" onClick={onResend} disabled={cooldown > 0}>
            {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend verification email'}
          </Button>
        </div>
      )}
      {resend.message && <Alert type={resend.status}>{resend.message}</Alert>}

      <form onSubmit={onSubmit} noValidate>
        <FormField label="Email address" name="email" type="email" value={form.email} onChange={onChange} autoComplete="email" />
        <FormField label="Password" name="password" type="password" value={form.password} onChange={onChange} autoComplete="current-password" />
        <div className="flex justify-end mb-5 -mt-2">
          <Link to="/forgot-password" className="text-sm font-medium text-rose-500 hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" full loading={loading}>Log in</Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-600">
        New here? <Link to="/register" className="text-rose-500 font-semibold hover:underline">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
