import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { AuthLayout } from '../components/AuthLayout';
import { FormField } from '../components/FormField';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';

const GENERIC = 'If an account exists for that email, a password reset link has been sent.';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    try { await api.post('/auth/forgot-password', { email: email.trim() }); } catch { /* never reveal whether the email exists */ }
    setSent(true);
    setLoading(false);
  };

  return (
    <AuthLayout title="Reset your password">
      {sent ? (
        <>
          <Alert type="success">{GENERIC}</Alert>
          <Button to="/login" variant="outline" full>Return to login</Button>
        </>
      ) : (
        <form onSubmit={onSubmit}>
          <p className="text-sm text-ink-600 mb-5 text-center">Enter your email and we'll send you a reset link.</p>
          <FormField label="Email address" name="email" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <Button type="submit" full loading={loading} disabled={!email.trim()}>Send reset link</Button>
          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm font-medium text-ink-600 hover:text-rose-500">Back to login</Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
