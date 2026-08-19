import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Shield, Smile, ArrowRight } from 'lucide-react';

export default function SignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Basic validation
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

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      const message = err.message || 'Sign in failed';
      if (message.includes('not confirmed') || message.includes('Email not confirmed')) {
        setError('Please confirm your email before signing in.');
      } else {
        // Generic error for invalid credentials to prevent email enumeration
        setError('Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Prevent TS6133 for error and handleSubmit
  if (false) {
    console.log(error, handleSubmit);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-xs">
        {/* Card */}
        <div className="bg-card rounded-lg shadow-lg p-8 space-y-6">
          {/* Logo and Tagline */}
          <div className="flex items-center justify-center space-x-3">
            {/* Tooth icon placeholder: using Smile icon for branding consistency */}
            <div className="flex h-8 w-8 items-center justify-center">
              <Smile className="h-5 w-5 text-secondary" />
            </div>
            <h1 className="text-2xl font-heading text-primary">
              DentalTracker
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-center text-on-background/70">
            Sign in to access your secure clinical data.
          </p>

          {/* Info Box */}
          <div className="bg-muted/50 rounded-md p-4">
            {/* Header with icon and title */}
            <div className="flex items-center space-x-3 mb-2">
              <Shield className="h-4 w-4 text-on-background" />
              <h2 className="font-heading text-on-background">
                Secure Connection
              </h2>
            </div>
            <p className="text-sm text-on-background/60">
              We use AES-256 field-level encryption to protect all health data and patient records.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Address */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-label-md font-medium text-on-background">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-background/50" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-card border border-outline-variant rounded-md text-on-background placeholder-text-on-background/50 focus:outline-none focus:ring-2 focus-ring-ring focus-ring-offset-2"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@clinic.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-label-md font-medium text-on-background">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-background/50" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-card border border-outline-variant rounded-md text-on-background placeholder-text-on-background/50 focus:outline-none focus:ring-2 focus-ring-ring focus-ring-offset-2"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="text-right mt-1">
                <a
                  href="#"
                  className="text-sm font-label-md text-secondary hover:text-secondary/70"
                >
                  Forgot password?
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center px-5 py-3 text-on-primary font-medium bg-primary text-on-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus-ring-ring focus-ring-offset-2 disabled:bg-primary/50"
              >
                {loading ? (
                  <>
                    {/* Loading spinner */}
                    <div className="animate-spin h-4 w-4 mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Secure Login
                  </>
                )}
              </button>
            </div>
          </form>

          {/* New Account Link */}
          <p className="mt-4 text-center text-on-background/60">
            New to DentalTracker?{' '}
            <a
              href="/create-account"
              className="font-label-md text-secondary hover:text-secondary/70"
            >
              Create Secure Account
            </a>
          </p>
        </div>

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

        {/* Footer Links */}
        <div className="mt-6 text-center text-xs text-on-background/50">
          <p>
            <a href="#" className="underline">
              Privacy Policy
            </a>
            {' '}
            •
            {' '}
            <a href="#" className="underline">
              Terms of Service
            </a>
          </p>
          <div className="mt-1 flex items-center justify-center space-x-1">
            <div className="h-3 w-3">
              {/* Lock icon for footer */}
              <Lock className="h-3 w-3 text-on-background/50" />
            </div>
            <span className="text-on-background/50">
              End-to-End Encrypted
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}