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
  const [requestEmail, setRequestEmail] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Fetch provider's patients and today's appointments
  useEffect(() => {
    let ignore = false;

    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);

        // Fetch patients
        const { data: patientsData, error: patientsError } = await supabase.rpc('get_my_patients');
        if (patientsError) throw patientsError;
        if (ignore) return;
        setPatients(patientsData || []);

        // Fetch appointments
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select('*')
          .gte('appointment_date', new Date().toISOString().split('T')[0])
          .lt('appointment_date', new Date(Date.now() + 86400000).toISOString().split('T')[0])
          .order('appointment_date', { ascending: true });

        if (appointmentsError) throw appointmentsError;
        if (ignore) return;

        // Filter and map appointments
        const connectedPatientIds = new Set((patientsData || []).map((p: any) => p.patient_id));
        const filtered = (appointmentsData || []).filter((apt: any) =>
          connectedPatientIds.has(apt.patient_id)
        );

        const patientMap = new Map((patientsData || []).map((p: any) => [p.patient_id, p.patient_name]));
        const appointmentsWithName = filtered.map((apt: any) => ({
          ...apt,
          patient_name: patientMap.get(apt.patient_id) || 'Unknown Patient'
        }));

        if (ignore) return;
        setTodaysAppointments(appointmentsWithName);
      } catch (err: unknown) {
        if (ignore) return;
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      ignore = true;
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRequestAccess = async () => {
    const email = requestEmail.trim();
    if (!email) {
      // Do nothing if empty; we won't show message because no attempt made
      return;
    }
    setRequestLoading(true);
    try {
      // Look up patient by email (returns patient_id if found, else empty)
      const { data: patientData, error: lookupError } = await supabase
        .rpc('find_patient_by_email', { lookup_email: email });
      if (lookupError) throw lookupError;

      // If we got a patient_id, attempt to insert a pending connection
      if (patientData && patientData.length > 0) {
        const patientId = patientData[0].patient_id;
        const providerId = user?.id;
        if (providerId) {
          // Check if an active or pending connection already exists
          const { data: existingConnections, error: checkError } = await supabase
            .from('provider_connections')
            .select('id')
            .eq('patient_id', patientId)
            .eq('provider_id', providerId)
            .in('status', ['active', 'pending']);

          if (checkError) {
            throw checkError;
          }

          // Only attempt to insert if no existing active/pending connection
          if (existingConnections.length === 0) {
            try {
              await supabase
                .from('provider_connections')
                .insert([
                  {
                    patient_id: patientId,
                    provider_id: providerId,
                    status: 'pending',
                    initiated_by: 'provider',
                  }
                ]);
            } catch (insertError) {
              // Ignore any insert error (e.g., duplicate from race condition) and still show generic message.
              console.debug('Insert error (ignored):', insertError);
            }
          }
          // If existing connection exists, we skip the insert entirely
        }
      }
      // If no patient data found, we still do nothing and show the same message.
    } catch (err: any) {
      // Log error for debugging but do not show to user.
      console.error('Request access error:', err);
    } finally {
      setRequestLoading(false);
      setRequestEmail(''); // Clear input
      setHasSubmitted(true);
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
          <div className="bg-red-50 border-l-2 border-red-500 text-red-700 p-4 mb-6" role="alert">
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
                        {apt.patient_name || 'Unknown Patient'}
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

        {/* Request Patient Access Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Request Patient Access
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Enter a patient's email to request access to their dental records.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); handleRequestAccess(); }} className="space-y-4">
            <div>
              <label htmlFor="patient-email" className="block text-sm font-medium text-gray-700 mb-2">
                Patient Email
              </label>
              <input
                id="patient-email"
                type="email"
                autoComplete="email"
                required
                value={requestEmail}
                onChange={(e) => setRequestEmail(e.target.value)}
                className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                disabled={requestLoading}
              />
            </div>
            <button
              type="submit"
              disabled={requestLoading}
              className="w-full flex items-center justify-center px-5 py-3.5 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md transition-colors duration-200"
            >
              {requestLoading ? 'Sending...' : 'Send Request'}
            </button>
          </form>
          {/* Always show the same message after submission attempt */}
          {hasSubmitted && !requestLoading && (
            <div className="bg-gray-50 border-l-2 border-gray-300 text-gray-600 p-4">
              <p>If an account exists with this email, a request has been sent.</p>
            </div>
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