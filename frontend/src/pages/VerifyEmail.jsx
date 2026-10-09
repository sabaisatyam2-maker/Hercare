import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { AuthLayout } from '../components/AuthLayout';
import { Button, Spinner } from '../components/Button';
import { Alert } from '../components/Alert';
import { getErrorMessage } from '../utils/format';

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const called = useRef(false); // StrictMode runs effects twice in dev; the token is single-use.

  useEffect(() => {
    if (called.current) return;
    called.current = true;
    api.get(`/auth/verify-email/${token}`)
      .then(({ data }) => { setMessage(data.message || 'Email verified!'); setStatus('success'); })
      .catch((err) => { setMessage(getErrorMessage(err, 'This link is invalid or has expired.')); setStatus('error'); });
  }, [token]);

  return (
    <AuthLayout title="Email verification">
      <div className="text-center">
        {status === 'verifying' && (
          <div className="flex flex-col items-center gap-3 text-ink-600 py-4">
            <Spinner className="h-8 w-8 text-rose-500" /> Verifying your email...
          </div>
        )}
        {status === 'success' && (
          <>
            <div className="text-5xl mb-3">🎉</div>
            <Alert type="success">{message}</Alert>
            <Button to="/login" full>Go to login</Button>
          </>
        )}
        {status === 'error' && (
          <>
            <Alert type="error">{message}</Alert>
            <Button to="/login" variant="outline" full>Back to login to resend</Button>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
