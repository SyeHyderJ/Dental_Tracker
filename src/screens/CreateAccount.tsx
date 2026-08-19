import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';

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

    // Basic validation
    if (name.trim() === '') {
      setError('Please enter your name');
      setLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { user: _user, session } = await register(email, password);
      // If email confirmation is required, there will be no session
      if (!session) {
        // Navigate to check email page, passing email via state
        navigate('/check-email', { state: { email } });
      } else {
        // If session exists (email confirmation off or auto-confirmed), go to dashboard
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* TOP NAV BAR */}
        <nav className="bg-primary text-on-primary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-4">
            {/* Left: circular avatar image placeholder */}
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-on-primary/20 flex items-center justify-center">
                <span className="text-on-primary">A</span>
              </div>
              <div className="hidden md:flex space-x-4 text-sm font-medium">
                {/* Nav links: Home / History / Chart / Settings */}
                <button
                  onClick={() => navigate('/', { replace: true })}
                  className="hover:text-on-primary/80 transition-colors p-1"
                >
                  Home
                </button>
                <button
                  onClick={() => navigate('/records', { replace: true })}
                  className="hover:text-on-primary/80 transition-colors p-1"
                >
                  History
                </button>
                <button
                  onClick={() => navigate('/tooth-chart', { replace: true })}
                  className="text-on-primary bg-on-primary/20 px-3 py-1 rounded-full"
                >
                  Chart
                </button>
                <button
                  onClick={() => navigate('/share-access', { replace: true })}
                  className="hover:text-on-primary/80 transition-colors p-1"
                >
                  Settings
                </button>
              </div>
            </div>

            {/* Center: DentalTracker wordmark */}
            <div className="flex items-center">
              <h1 className="text-2xl font-heading text-on-primary">
                DentalTracker
              </h1>
            </div>

            {/* Right: lock icon */}
            <div className="flex items-center">
              <div className="h-8 w-8 flex items-center justify-center bg-on-primary/20 rounded-full">
                <span className="text-on-primary">🔒</span>
              </div>
            </div>
          </div>
        </nav>

        <div className="mx-auto max-w-xl space-y-12">
        {/* Logo and Tagline */}
        <div className="text-center">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-indigo-600">
            <UserPlus className="h-5 w-5 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create Your SmileGuard Account
          </h2>
          <p className="mt-4 text-xl text-gray-500">
            Track your dental health with confidence
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-6" role="alert">
            <p>{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-5 py-3.5 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md transition-colors duration-200"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400">
          <p>
            Already have an account?{' '}
            <a
              href="/sign-in"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign In
            </a>
          </p>
          <p>
            By signing up, you agree to our{' '}
            <a href="#" className="underline">
              Terms of Service
            </a>
            and{' '}
            <a href="#" className="underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}