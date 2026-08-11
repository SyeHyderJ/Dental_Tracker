import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function ProviderDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todaysAppointments, setTodaysAppointments] = useState<Array<any>>([]);

  // Fetch provider's patients
  useEffect(() => {
    if (user) {
      const fetchPatients = async () => {
        try {
          setLoading(true);
          const { data, error } = await supabase.rpc('get_my_patients');
          if (error) throw error;
          setPatients(data || []);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchPatients();

      // Also fetch today's appointments for all connected patients
      const fetchTodaysAppointments = async () => {
        try {
          const { data, error } = await supabase
            .from('appointments')
            .select('*, patient_id, profiles!appointments_user_id_fkey(full_name)')
            .gte('appointment_date', new Date().toISOString().split('T')[0])
            .lt('appointment_date', new Date(Date.now() + 86400000).toISOString().split('T')[0])
            .order('appointment_date', { ascending: true });
          if (error) throw error;
          // Filter to only appointments for connected patients (RLS should already do this, but double-check)
          const connectedPatientIds = new Set(patients.map(p => p.patient_id));
          const filtered = data.filter((apt: any) => connectedPatientIds.has(apt.patient_id));
          setTodaysAppointments(filtered);
        } catch (err: any) {
          setError(err.message);
        }
      };
      fetchTodaysAppointments();
    }
  }, [user, patients]);

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
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full border-4 border-t-indigo-600 w-12 h-12"></div>
      </div>
    );
  }

  if (!user) {
    navigate('/sign-in', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-extrabold text-gray-900">
              Provider Portal
            </h1>
            <p className="mt-2 text-xl text-gray-500">
              Manage your patients' dental records
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Sign Out
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{error}</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Connected Patients</h3>
            <p className="text-3xl font-bold text-teal-600">{patients.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Today's Appointments</h3>
            <p className="text-3xl font-bold text-teal-600">{todaysAppointments.length}</p>
          </div>
        </div>

        {/* Today's Appointments Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Today's Appointments
          </h2>
          {todaysAppointments.length > 0 ? (
            <div className="space-y-4">
              {todaysAppointments.map((apt) => (
                <div key={apt.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {apt.profiles?.full_name || 'Unknown Patient'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(apt.appointment_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    <div className="text-sm text-gray-600">
                      {apt.notes && (
                        <p className="line-clamp-2">
                          {apt.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              No appointments scheduled for today.
            </p>
          )}
        </div>

        {/* My Patients List */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            My Patients
          </h2>
          {patients.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              You haven't connected with any patients yet.
            </p>
          ) : (
            <div className="space-y-4">
              {patients.map(patient => (
                <div key={patient.patient_id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {patient.patient_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Connected since: {new Date(patient.connected_since).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/provider/patient/${patient.patient_id}`)}
                      className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                    >
                      View Records
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}