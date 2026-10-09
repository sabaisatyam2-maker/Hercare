import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { AuthLayout } from '../components/AuthLayout';
import { FormField } from '../components/FormField';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { getErrorMessage } from '../utils/format';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    const err = {};
    if (form.password.length < 8) err.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) err.confirmPassword = 'Passwords do not match';
    setErrors(err);
    if (Object.keys(err).length) return;

    setStatus('loading'); setMessage('');
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password: form.password });
      setMessage(data.message || 'Password reset successful!');
      setStatus('success');
      timer.current = setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      setMessage(getErrorMessage(error, 'This link is invalid or has expired.'));
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <AuthLayout title="Password updated ✨">
        <Alert type="success">{message}</Alert>
        <p className="text-sm text-ink-600 text-center mb-4">Taking you to login...</p>
        <Button to="/login" full>Go to login now</Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create a new password">
      {status === 'error' && <Alert type="error">{message}</Alert>}
      <form onSubmit={onSubmit} noValidate>
        <FormField label="New password" name="password" type="password" value={form.password} onChange={onChange} error={errors.password} autoComplete="new-password" />
        <FormField label="Confirm new password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={onChange} error={errors.confirmPassword} autoComplete="new-password" />
        <div className="mt-6"><Button type="submit" full loading={status === 'loading'}>Reset password</Button></div>
      </form>
      {status === 'error' && (
        <p className="mt-6 text-center text-sm">
          <Link to="/forgot-password" className="text-rose-500 font-semibold hover:underline">Request a new link</Link>
        </p>
      )}
    </AuthLayout>
  );
}
