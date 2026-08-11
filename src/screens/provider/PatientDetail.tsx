import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from '../../components/BackButton';

export default function PatientDetail() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();
  const [patientName, setPatientName] = useState<string>('');
  const [toothRecords, setToothRecords] = useState<Array<any>>([]);
  const [appointments, setAppointments] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch patient name and their records
  useEffect(() => {
    if (user && patientId) {
      const fetchData = async () => {
        try {
          setLoading(true);
          // Get the list of patients for this provider (from the secure function)
          const { data: patientsData, error: patientsError } = await supabase
            .rpc('get_my_patients');
          if (patientsError) throw patientsError;
          // Find the patient in the list to get the name
          const patient = patientsData?.find((p: { patient_id: string; patient_name: string }) => p.patient_id === patientId);
          setPatientName(patient?.patient_name || 'Unknown Patient');

          // Get tooth records for this patient
          const { data: recordsData, error: recordsError } = await supabase
            .from('tooth_records')
            .select('*')
            .eq('user_id', patientId)
            .order('date', { ascending: false });
          if (recordsError) throw recordsError;
          setToothRecords(recordsData || []);

          // Get appointments for this patient
          const { data: aptsData, error: aptsError } = await supabase
            .from('appointments')
            .select('*')
            .eq('user_id', patientId)
            .order('appointment_date', { ascending: false });
          if (aptsError) throw aptsError;
          setAppointments(aptsData || []);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [user, patientId]);


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

  if (!patientId) {
    navigate('/provider/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <BackButton to="/provider/dashboard" />
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">
              Viewing {patientName}'s Records
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Read-only access
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{error}</p>
          </div>
        )}

        {/* Tooth Chart (read-only) */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Tooth Chart
          </h2>
          {toothRecords.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No dental records for this patient.
            </p>
          ) : (
            <div className="space-y-6">
              {Object.entries(
                toothRecords.reduce((acc: { [key: string]: any[] }, record) => {
                  const tooth = record.tooth_number;
                  if (!acc[tooth]) acc[tooth] = [];
                  acc[tooth].push(record);
                  return acc;
                }, {})
              ).map(([toothNumberStr, records]) => {
                const toothNumber = parseInt(toothNumberStr, 10);
                const sorted = [...records].sort(
                  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                );
                const mostRecent = sorted[0];
                const getConditionColorClass = (condition: string) => {
                  const lower = condition.toLowerCase();
                  if (lower === 'healthy' || lower === 'filling' || lower === 'crown') {
                    return 'bg-green-500';
                  } else if (lower === 'cavity' || lower === 'extracted') {
                    return 'bg-red-500';
                  } else {
                    return 'bg-yellow-500';
                  }
                };
                const conditionColorClass = getConditionColorClass(mostRecent.condition);
                return (
                  <div key={toothNumber} className="bg-white rounded-lg shadow-xl p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          Tooth #{toothNumber}
                        </h2>
                        <p className="text-sm text-gray-500">
                          {new Date(mostRecent.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`h-3 w-3 rounded-full ${conditionColorClass}`}></div>
                      <span className="font-medium text-gray-900 capitalize">
                        {mostRecent.condition}
                      </span>
                    </div>
                    {mostRecent.notes && (
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {mostRecent.notes}
                      </p>
                    )}
                    {sorted.length > 1 && (
                      <div className="mt-4 pt-4 border-t">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Full History
                        </h3>
                        <div className="space-y-4">
                          {sorted.map((record) => (
                            <div key={record.id} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-gray-900">
                                  {record.condition}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {new Date(record.date).toLocaleDateString()}
                                </span>
                              </div>
                              {record.notes && (
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {record.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              )}
            </div>
          )}
        </section>

        {/* Appointments (read-only) */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Appointments
          </h2>
          {appointments.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No appointments for this patient.
            </p>
          ) : (
            <div className="space-y-4">
              {appointments.map(apt => (
                <div key={apt.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Appointment
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(apt.appointment_date).toLocaleString()}
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
          )}
        </section>

        {/* Records History (read-only) */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Records History
          </h2>
          {toothRecords.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No records history.
            </p>
          ) : (
            <div className="space-y-4">
              {toothRecords.map(record => (
                <div key={record.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Tooth #{record.tooth_number} - {record.condition}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(record.date).toLocaleDateString()}
                      </p>
                    </div>
                    {record.notes && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {record.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}