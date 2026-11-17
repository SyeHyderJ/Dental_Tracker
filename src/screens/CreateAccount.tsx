import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { ErrorBanner, Field } from '../components/ui';

export default function CreateAccount() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (name.trim() === '') {
      setError('Enter your name.');
      setLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('Enter a valid email address.');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const { session } = await register(email, password);
      if (!session) {
        navigate('/check-email', { state: { email } });
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your record"
      subtitle="Set up a private account for your dental chart and health history."
    >
      {error ? <div className="mb-4"><ErrorBanner>{error}</ErrorBanner></div> : null}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field id="name" label="Full name">
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            className="field-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field id="email" label="Email">
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className="field-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field id="password" label="Password">
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            className="field-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field id="confirm-password" label="Confirm password">
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            className="field-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </Field>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate">
        Already have an account?{' '}
        <a href="/sign-in" className="font-semibold text-primary">
          Sign in
        </a>
      </p>
    </AuthLayout>
  );
}
