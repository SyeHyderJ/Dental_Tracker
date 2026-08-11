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
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full border-4 border-t-indigo-600 w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {userData?.full_name || user?.email?.split('@')[0] || 'User'}!
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Your dental health dashboard
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate('/tooth-chart')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Tooth Chart
            </button>
            <button
              onClick={() => navigate('/appointments')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Appointments
            </button>
            <button
              onClick={() => navigate('/records')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Records
            </button>
            <button
              onClick={() => navigate('/share-access')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Share Access
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign Out
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{error}</p>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Total Records</h3>
            <p className="text-3xl font-bold text-indigo-600">{records.length}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Last Visit</h3>
            <p className="text-2xl font-bold text-indigo-600">
              {records.length > 0 ? new Date(records[0].created_at).toLocaleDateString() : 'No records'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Streak</h3>
            <p className="text-3xl font-bold text-indigo-600">0</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Next Checkup</h3>
            <p className="text-2xl font-bold text-indigo-600">TBD</p>
          </div>
        </div>

        {/* Recent Records */}
        <div className="mb-8">
          <h2 className="sr-only">Recent dental records</h2>
          <div className="space-y-6">
            {records.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No dental records yet. Add your first record to get started.</p>
              </div>
            ) : (
              <>
                {records.map((record) => (
                  <div key={record.id} className="bg-white rounded-lg shadow p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {record.record_type || 'Dental Checkup'}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {new Date(record.recorded_at || record.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-1 text-xs font-medium
                          {record.status === 'completed' ? 'bg-green-100 text-green-800' :
                           record.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                           'bg-gray-100 text-gray-800'}
                        ">
                          {record.status?.charAt(0).toUpperCase() + record.status?.slice(1) || 'Recorded'}
                        </span>
                      </div>
                    </div>
                    {record.notes && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">{record.notes}</p>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to track your first dental record?
          </h2>
          <p className="max-w-xl mx-auto text-lg text-gray-600 mb-6">
            Start logging your dental checkups, treatments, and daily oral hygiene habits to maintain a healthy smile.
          </p>
          {/* Placeholder button - would navigate to ToothChart or Records screen */}
          <button className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Add First Record
          </button>
        </div>
      </div>
    </div>
  );
}