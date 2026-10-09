import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { AuthLayout } from '../components/AuthLayout';
import { FormField } from '../components/FormField';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { getErrorMessage } from '../utils/format';

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resend, setResend] = useState({ message: '', status: '' });

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'A valid email is required';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      setDone(true);
    } catch (err) {
      setServerError(getErrorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (cooldown > 0) return;
    setCooldown(30);
    try {
      const { data } = await api.post('/auth/resend-verification', { email: form.email.trim() });
      setResend({ message: data.message || 'Verification email sent.', status: 'success' });
    } catch (err) {
      setResend({ message: getErrorMessage(err, 'Could not resend the email.'), status: 'error' });
    }
  };

  if (done) {
    return (
      <AuthLayout title="Check your email 💌">
        <Alert type="success">
          We sent a verification link to <b>{form.email}</b>. Open it to activate your account.
        </Alert>
        {resend.message && <Alert type={resend.status}>{resend.message}</Alert>}
        <div className="flex flex-col gap-3">
          <Button variant="outline" onClick={onResend} disabled={cooldown > 0}>
            {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend verification email'}
          </Button>
          <Button to="/login">Go to login</Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create your account" subtitle="A calmer way to care for your body.">
      <Alert type="error">{serverError}</Alert>
      <form onSubmit={onSubmit} noValidate>
        <FormField label="Full name" name="name" value={form.name} onChange={onChange} error={errors.name} autoComplete="name" />
        <FormField label="Email address" name="email" type="email" value={form.email} onChange={onChange} error={errors.email} autoComplete="email" />
        <FormField label="Password" name="password" type="password" value={form.password} onChange={onChange} error={errors.password} autoComplete="new-password" hint="At least 8 characters" />
        <FormField label="Confirm password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={onChange} error={errors.confirmPassword} autoComplete="new-password" />
        <div className="mt-6"><Button type="submit" full loading={loading}>Create account</Button></div>
      </form>
      <p className="mt-6 text-center text-sm text-ink-600">
        Already have an account? <Link to="/login" className="text-rose-500 font-semibold hover:underline">Log in</Link>
      </p>
    </AuthLayout>
  );
}
