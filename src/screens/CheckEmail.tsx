import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import AuthLayout from '../components/AuthLayout';
import { ErrorBanner, SuccessBanner } from '../components/ui';

export default function CheckEmail() {
  const location = useLocation();
  const { resend } = useAuth();
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const resendTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const state = location.state as { email?: string } | undefined;
    if (state?.email) setEmail(state.email);
  }, [location.state]);

  useEffect(() => {
    return () => {
      if (resendTimeoutRef.current) clearTimeout(resendTimeoutRef.current);
    };
  }, []);

  const handleResend = async () => {
    if (!email) return;
    setResendLoading(true);
    setResendMessage('');
    setFailed(false);
    try {
      await resend(email);
      setResendMessage('Confirmation email sent.');
      if (resendTimeoutRef.current) clearTimeout(resendTimeoutRef.current);
      resendTimeoutRef.current = setTimeout(() => setResendLoading(false), 30000);
    } catch (err: any) {
      setFailed(true);
      setResendMessage(err.message || 'Could not resend the email.');
      setResendLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Check your email"
      subtitle={email ? `We sent a confirmation link to ${email}. Open it, then sign in.` : 'We sent a confirmation link. Open it, then sign in.'}
    >
      {resendMessage ? (
        <div className="mb-4">
          {failed ? <ErrorBanner>{resendMessage}</ErrorBanner> : <SuccessBanner>{resendMessage}</SuccessBanner>}
        </div>
      ) : null}
      <button type="button" onClick={handleResend} disabled={resendLoading} className="btn-primary">
        {resendLoading ? 'Sending...' : 'Resend confirmation email'}
      </button>
      <p className="mt-6 text-center text-sm text-slate">
        Already confirmed?{' '}
        <a href="/sign-in" className="font-semibold text-primary">
          Sign in
        </a>
      </p>
    </AuthLayout>
  );
}
