import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Bell, Loader2 } from 'lucide-react';

export default function CheckEmail() {
  const location = useLocation();
  const { resend } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string>('');
  const resendTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Extract email from state on initial mount or when location.state changes
  useEffect(() => {
    // @ts-ignore
    const state = location.state as { email?: string } | undefined;
    if (state?.email) {
      setEmail(state.email);
    }
  }, [location.state]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (resendTimeoutRef.current) {
        clearTimeout(resendTimeoutRef.current);
      }
    };
  }, []);

  const handleResend = async () => {
    if (!email) return;
    setResendLoading(true);
    setResendMessage('');
    try {
      await resend(email);
      setResendMessage('Confirmation email resent!');
      // disable button for 30 seconds
      if (resendTimeoutRef.current) {
        clearTimeout(resendTimeoutRef.current);
      }
      resendTimeoutRef.current = setTimeout(() => {
        setResendLoading(false);
      }, 30000);
    } catch (err: any) {
      setResendMessage(`Failed to resend: ${err.message}`);
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl space-y-12">
        {/* Logo and Tagline */}
        <div className="text-center">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-indigo-600">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Check Your Email
          </h2>
          <p className="mt-4 text-xl text-gray-500">
            We've sent a confirmation link to {email}. Click the link to activate your account, then sign in.
          </p>
        </div>

        {/* Resend Message */}
        {resendMessage && (
          <div className={resendMessage.startsWith('Failed') ? 'bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6' : 'bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6'} role="alert">
            <p>{resendMessage}</p>
          </div>
        )}

        {/* Resend Button */}
        <div className="flex justify-center">
          <button
            onClick={handleResend}
            disabled={resendLoading}
            className={`w-full flex items-center justify-center px-4 py-3 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md ${resendLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {resendLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              'Resend confirmation email'
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400">
          <p>
            Already confirmed?{' '}
            <a
              href="/sign-in"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}