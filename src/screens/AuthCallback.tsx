import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Spinner } from '../components/ui';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (session) {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/sign-in', {
            state: { message: 'Confirmation link invalid or expired. Please sign up again.' },
            replace: true,
          });
        }
      } catch {
        navigate('/sign-in', {
          state: { message: 'Confirmation failed. Please sign up again.' },
          replace: true,
        });
      }
    };

    handleAuth();
  }, [navigate]);

  return <Spinner />;
}
