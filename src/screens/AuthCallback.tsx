import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Log only non-sensitive URL info for debugging
    console.log('AuthCallback: URL received - pathname:', window.location.pathname);
    // Log whether we have search or hash params (without exposing their values)
    console.log('AuthCallback: Has search params:', !!window.location.search);
    console.log('AuthCallback: Has hash params:', !!window.location.hash);

    const handleAuth = async () => {
      try {
        // This will detect the session from the URL if present
        const { data: { session }, error } = await supabase.auth.getSession();

        // Log only non-sensitive info for debugging
        console.log('AuthCallback: Session check - session exists:', !!session);
        if (error) {
          console.log('AuthCallback: Session check - error occurred:', !!error);
        }

        if (error) throw error;
        if (session) {
          // Session exists, meaning confirmation succeeded
          console.log('AuthCallback: Session confirmed, navigating to dashboard');
          navigate('/dashboard', { replace: true });
        } else {
          // No session, possibly expired or invalid link
          console.log('AuthCallback: No valid session, navigating to sign-in');
          navigate('/sign-in', { state: { message: 'Confirmation link invalid or expired. Please sign up again.' }, replace: true });
        }
      } catch (err: any) {
        // Log only that an error occurred, not the error details
        console.log('AuthCallback: Auth process failed');
        navigate('/sign-in', { state: { message: 'Confirmation failed. Please sign up again.' }, replace: true });
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <>
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
                onClick={() => navigate('/sign-in', { replace: true })}
                className="hover:text-on-primary/80 transition-colors p-1"
              >
                Sign In
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

      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-indigo-600">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Confirming your account...
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            This should take just a moment.
          </p>
        </div>
      </div>
    </>
  );
}