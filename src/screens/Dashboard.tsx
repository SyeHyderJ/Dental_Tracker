import { useAuth } from '../lib/auth';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<any[]>([]);

  // Fetch user profile data
  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        try {
          const { data, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (fetchError) throw fetchError;
          if (data) setUserData(data);
        } catch (err: any) {
          // If profile doesn't exist, create it
          if (err.code === 'PGRST116') {
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert([
                {
                  id: user.id,
                  email: user.email,
                  full_name: user.user_metadata?.full_name || '',
                  avatar_url: user.user_metadata?.avatar_url || '',
                }
              ])
              .select()
              .single();

            if (insertError) throw insertError;
            if (newProfile) setUserData(newProfile);
          } else {
            setError(err.message);
          }
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Fetch user's dental records
  useEffect(() => {
    if (user) {
      const fetchRecords = async () => {
        try {
          const { data, error } = await supabase
            .from('tooth_records')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;
          setRecords(data || []);
        } catch (err: any) {
          setError(err.message);
        }
      };

      fetchRecords();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full border-4 border-t-primary w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-heading text-primary mb-2">
              Welcome back, {userData?.full_name || user?.email?.split('@')[0] || 'User'}!
            </h1>
            <p className="text-sm font-body text-foreground/60">
              Your dental health dashboard
            </p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/tooth-chart')}
              className="px-4 py-2 text-sm font-medium text-foreground bg-card hover:bg-muted/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/70 transition-colors duration-150"
            >
              Tooth Chart
            </button>
            <button
              onClick={() => navigate('/appointments')}
              className="px-4 py-2 text-sm font-medium text-foreground bg-card hover:bg-muted/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/70 transition-colors duration-150"
            >
              Appointments
            </button>
            <button
              onClick={() => navigate('/records')}
              className="px-4 py-2 text-sm font-medium text-foreground bg-card hover:bg-muted/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/70 transition-colors duration-150"
            >
              Records
            </button>
            <button
              onClick={() => navigate('/share-access')}
              className="px-4 py-2 text-sm font-medium text-foreground bg-card hover:bg-muted/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/70 transition-colors duration-150"
            >
              Share Access
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-foreground bg-card hover:bg-muted/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/70 transition-colors duration-150"
            >
              Sign Out
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border-l-2 border-destructive text-destructive p-4 mb-6" role="alert">
            <p>{error}</p>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="bg-card rounded-lg p-4 hover:bg-muted/70 transition-colors duration-150">
            <h3 className="text-sm font-semibold text-foreground mb-1">Total Records</h3>
            <p className="text-2xl font-bold text-primary">{records.length}</p>
          </div>

          <div className="bg-card rounded-lg p-4 hover:bg-muted/70 transition-colors duration-150">
            <h3 className="text-sm font-semibold text-foreground mb-1">Last Visit</h3>
            <p className="text-lg font-bold text-accent">
              {records.length > 0 ? new Date(records[0].created_at).toLocaleDateString() : 'No records'}
            </p>
          </div>

          <div className="bg-card rounded-lg p-4 hover:bg-muted/70 transition-colors duration-150">
            <h3 className="text-sm font-semibold text-foreground mb-1">Streak</h3>
            <p className="text-2xl font-bold text-secondary">0</p>
          </div>

          <div className="bg-card rounded-lg p-4 hover:bg-muted/70 transition-colors duration-150">
            <h3 className="text-sm font-semibold text-foreground mb-1">Next Checkup</h3>
            <p className="text-lg font-bold text-primary">TBD</p>
          </div>
        </div>

        {/* Recent Records */}
        <div className="mb-6">
          <h2 className="sr-only font-body text-foreground mb-2">Recent dental records</h2>
          {records.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm font-body text-foreground/60">
                No dental records yet. Add your first record to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record, _index) => (
                <div
                  key={record.id}
                  className="bg-card rounded-lg p-3 hover:bg-muted/70 transition-colors duration-150"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-heading text-foreground mb-1">
                        {record.record_type || 'Dental Checkup'}
                      </h3>
                      <p className="text-xs font-body text-foreground/60">
                        {new Date(record.recorded_at || record.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 text-xs font-medium
                        {record.status === 'completed' ? 'bg-accent/20 text-accent' :
                         record.status === 'pending' ? 'bg-secondary/20 text-secondary' :
                         'bg-muted/20 text-foreground/60'}
                      ">
                        {record.status?.charAt(0).toUpperCase() + record.status?.slice(1) || 'Recorded'}
                      </span>
                    </div>
                  </div>
                  {record.notes && (
                    <p className="mt-1 text-xs font-body text-foreground/60 line-clamp-2">{record.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="text-center py-6">
          <h2 className="text-xl font-heading text-primary mb-4">
            Ready to track your first dental record?
          </h2>
          <p className="max-w-xl mx-auto text-lg font-body text-foreground/60 mb-4">
            Start logging your dental checkups, treatments, and daily oral hygiene habits to maintain a healthy smile.
          </p>
          <button className="px-5 py-2 bg-primary text-white font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/80 transition-colors duration-150">
            Add First Record
          </button>
        </div>
      </div>
    </div>
  );
}