import { useAuth } from '../lib/auth';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, CalendarCheck, FolderOpen, History, Home, Lock, ShieldCheck, Settings, Activity, Users } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Calculated values
  const [totalRecords, setTotalRecords] = useState(0);
  const [lastVisit, setLastVisit] = useState<string>('No records');
  const [streakDays, setStreakDays] = useState(0);
  const [nextCheckup, setNextCheckup] = useState<string>('TBD');
  const [greeting, setGreeting] = useState<string>('Welcome back');

  // Fetch user profile data, records, and appointments
  useEffect(() => {
    if (!user) {
      setLoading(false);
      setUserData(null);
      setRecords([]);
      setAppointments([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const fetchUserData = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (data) setUserData(data);
      } catch (err: any) {
        // If profile doesn't exist, create it
        if (err.code === 'PGRST116') {
          const { data: newProfile } = await supabase
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

          if (newProfile) setUserData(newProfile);
        } else {
          setError(err.message);
        }
      }
    };

    const fetchRecords = async () => {
      try {
        const { data, error } = await supabase
          .from('tooth_records')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false }); // most recent first

        if (error) throw error;
        setRecords(data || []);
      } catch (err: any) {
        setError(err.message);
      }
    };

    const fetchAppointments = async () => {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('user_id', user.id)
          .order('appointment_date', { ascending: true }); // soonest first

        if (error) throw error;
        setAppointments(data || []);
      } catch (err: any) {
        setError(err.message);
      }
    };

    // Run all three and then set loading to false
    Promise.all([fetchUserData(), fetchRecords(), fetchAppointments()])
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  // Calculate stats when records or appointments change
  useEffect(() => {
    if (records.length > 0) {
      setTotalRecords(records.length);

      // Most recent record date
      const mostRecent = records.reduce((prev, current) =>
        new Date(prev.date) > new Date(current.date) ? prev : current
      );
      setLastVisit(new Date(mostRecent.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }));

      // Calculate streak (consecutive days with records from today backwards)
      const streak = calculateStreak(records);
      setStreakDays(streak);
    } else {
      setTotalRecords(0);
      setLastVisit('No records');
      setStreakDays(0);
    }

    // Find next upcoming appointment
    if (appointments.length > 0) {
      const now = new Date();
      const upcoming = appointments.filter(appt =>
        new Date(appt.appointment_date) > now
      );

      if (upcoming.length > 0) {
        const soonest = upcoming.reduce((prev, current) =>
          new Date(prev.appointment_date) < new Date(current.appointment_date) ? prev : current
        );
        setNextCheckup(new Date(soonest.appointment_date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }));
      } else {
        setNextCheckup('TBD');
      }
    } else {
      setNextCheckup('TBD');
    }
  }, [records, appointments]);

  // Calculate time-aware greeting
  useEffect(() => {
    const hour = new Date().getHours();
    let greetingText = 'Welcome back';

    if (hour >= 5 && hour < 12) {
      greetingText = 'Good morning';
    } else if (hour >= 12 && hour < 17) {
      greetingText = 'Good afternoon';
    } else if (hour >= 17 && hour < 22) {
      greetingText = 'Good evening';
    }

    setGreeting(greetingText);
  }, []);

  // Helper function to calculate streak of consecutive days with records
  const calculateStreak = (records: any[]) => {
    if (records.length === 0) return 0;

    // Get unique dates from records
    const dates = [...new Set(records.map(r => new Date(r.date).toDateString()))];

    // Sort dates descending (most recent first)
    dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    // Start from today and count backwards
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day

    let currentDate = today;

    for (const dateStr of dates) {
      const recordDate = new Date(dateStr);
      recordDate.setHours(0, 0, 0, 0); // Reset to start of day

      // Check if this date matches our expected date in the streak
      if (recordDate.getTime() === currentDate.getTime()) {
        streak++;
        // Move to yesterday
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (recordDate.getTime() < currentDate.getTime()) {
        // We've found a gap, break the streak
        break;
      }
      // If recordDate > currentDate, it's a future date (shouldn't happen with proper data)
      // or we're still looking for today's date
    }

    return streak;
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/', { replace: true });
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-red-50 border-l-2 border-red-500 text-red-700 p-6">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface text-primary font-sans min-h-screen pb-24">
      {/* Top App Bar */}
      <header className="flex justify-between items-center px-4 py-4 sticky top-0 bg-surface/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container">
            {userData?.avatar_url ? (
              <img
                src={userData.avatar_url}
                alt="Doctor profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center bg-primary/20 text-on-primary">
                <Activity className="h-5 w-5" />
              </div>
            )}
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            DentalTracker
          </h1>
        </div>
        <button
          className="p-2 hover:bg-surface-container-low rounded-full transition-colors"
          onClick={handleLogout}
        >
          <Lock className="h-4 w-4" />
        </button>
      </header>

      <main className="px-4 space-y-8">
        {/* Welcome Header */}
        <section>
          <h2 className="text-3xl font-bold text-slate-900">
            {greeting}, {userData?.full_name || user?.email?.split('@')[0] || 'User'}!
          </h2>
          <p className="text-slate-500 mt-1">
            Here is your daily overview.
          </p>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-card p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 text-slate-600 mb-3">
              <FolderOpen className="h-4 w-4 text-slate-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Records</span>
            </div>
            <div className="text-3xl font-bold text-slate-900">
              {totalRecords}
            </div>
          </div>

          <div className="bg-card p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 text-slate-600 mb-3">
              <Calendar className="h-4 w-4 text-slate-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Last Visit</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {lastVisit}
            </div>
          </div>

          <div className="bg-info-container/50 p-5 rounded-2xl border border-info-container/50 shadow-sm">
            <div className="flex items-center gap-2 text-on-info-container mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider">Streak</span>
            </div>
            <div className="text-2xl font-bold text-on-info-container">
              {streakDays} Days
            </div>
          </div>

          <div className="bg-card p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 text-slate-600 mb-3">
              <CalendarCheck className="h-4 w-4 text-slate-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Next Checkup</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {nextCheckup}
            </div>
          </div>
        </section>

        {/* Health Overview Section - Removed as it was placeholder text per requirements */}
        {/*
        <section>
          <h3 className="text-lg font-bold mb-4">Health Overview</h3>
          <div className="bg-card p-6 rounded-2xl border border-slate-100 shadow-sm leading-relaxed text-slate-700">
            <p>
              {totalRecords} records logged, most recent on {lastVisit}.
              {streakDays > 0 ? `Current streak of ${streakDays} days` : 'Start logging to build your streak!'}
            </p>
          </div>
        </section>
        */}

        {/* Quick Actions */}
        <section>
          <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              className="w-full flex items-center gap-4 p-4 bg-card rounded-2xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors text-left group"
              onClick={() => navigate('/tooth-chart')}
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-active:scale-95 transition-transform">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold">Clinical Chart</div>
                <div className="text-sm text-slate-500">View and update tooth records.</div>
              </div>
            </button>

            <button
              className="w-full flex items-center gap-4 p-4 bg-card rounded-2xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors text-left group"
              onClick={() => navigate('/records')}
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 group-active:scale-95 transition-transform">
                <History className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold">Procedure History</div>
                <div className="text-sm text-slate-500">Full log of past treatments.</div>
              </div>
            </button>

            <button
              className="w-full flex items-center gap-4 p-4 bg-card rounded-2xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors text-left group"
              onClick={() => navigate('/appointments')}
            >
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600 group-active:scale-95 transition-transform">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold">Appointments</div>
                <div className="text-sm text-slate-500">View and schedule checkups.</div>
              </div>
            </button>

            <button
              className="w-full flex items-center gap-4 p-4 bg-card rounded-2xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors text-left group"
              onClick={() => navigate('/share-access')}
            >
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 group-active:scale-95 transition-transform">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold">Share Access</div>
                <div className="text-sm text-slate-500">Grant providers access to your records.</div>
              </div>
            </button>
          </div>
        </section>

        {/* Security Banner */}
        <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 text-center">
          <p className="text-[11px] text-blue-700 font-medium flex items-center justify-center gap-2 uppercase tracking-tight">
            <ShieldCheck className="h-3 w-3" />
            All data is protected with AES-256 field-level encryption
          </p>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-card border-t border-slate-100 px-6 pb-6 pt-3 flex justify-around items-center z-50">
        <button
          className={`flex flex-col items-center gap-1 text-slate-900`}
          onClick={() => navigate('/dashboard')} // Stay on dashboard
        >
          <div className="bg-slate-900 text-white p-2 rounded-xl">
            <Home className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold">Home</span>
        </button>

        <button
          className="flex flex-col items-center gap-1 text-slate-400 p-2"
          onClick={() => navigate('/records')}
        >
          <History className="h-4 w-4" />
          <span className="text-[10px] font-bold">History</span>
        </button>

        <button
          className="flex flex-col items-center gap-1 text-slate-400 p-2"
          onClick={() => navigate('/tooth-chart')}
        >
          <Activity className="h-4 w-4" />
          <span className="text-[10px] font-bold">Chart</span>
        </button>

        <button
          className="flex flex-col items-center gap-1 text-slate-400 p-2"
          onClick={() => navigate('/settings')}
        >
          <Settings className="h-4 w-4" />
          <span className="text-[10px] font-bold">Settings</span>
        </button>
      </nav>
    </div>
  );
}