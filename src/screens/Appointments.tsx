import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';

export default function Appointments() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [formDate, setFormDate] = useState<string>(''); // YYYY-MM-DD
  const [formTime, setFormTime] = useState<string>(''); // HH:mm
  const [formProvider, setFormProvider] = useState<string>(''); // Provider name
  const [formNotes, setFormNotes] = useState<string>('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Generate time options from 8:00 AM to 6:00 PM every 30 minutes (12-hour clock with AM/PM)
  const timeOptions = [];
  for (let hour = 8; hour < 18; hour++) {
    for (const minute of [0, 30]) {
      const hourStr = String(hour).padStart(2, '0');
      const minuteStr = String(minute).padStart(2, '0');
      const value = `${hourStr}:${minuteStr}`; // 24-hour format for value

      // Convert to 12-hour for label
      let hour12 = hour % 12;
      if (hour12 === 0) hour12 = 12;
      const period = hour < 12 ? 'AM' : 'PM';
      const label = `${hour12}:${minuteStr} ${period}`;

      timeOptions.push({ value, label });
    }
  }

  // Fetch all appointments for the current user
  useEffect(() => {
    if (user) {
      const fetchAppointments = async () => {
        try {
          setLoading(true);
          const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('user_id', user.id)
            .order('appointment_date', { ascending: true }); // soonest first

          if (error) throw error;
          setAppointments(data || []);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchAppointments();
    }
  }, [user]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Handle selecting an appointment to edit
  const handleEditSelect = (appointment: any) => {
    setSelectedAppointment(appointment);
    setIsEditMode(true);

    // Convert UTC appointment_date to local date and time for the form
    const dateObj = new Date(appointment.appointment_date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const localDate = `${year}-${month}-${day}`;

    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const localTime = `${hours}:${minutes}`;

    setFormDate(localDate);
    setFormTime(localTime);
    setFormProvider(appointment.provider_name || '');
    setFormNotes(appointment.notes || '');
    setFormError(null);
    setFormSuccess(false);
  };

  // Handle deleting an appointment
  const handleDelete = async (appointmentId: string) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Refetch appointments
      const { data, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user?.id)
        .order('appointment_date', { ascending: true });

      if (fetchError) throw fetchError;
      setAppointments(data || []);

      // Close any open modal
      setSelectedAppointment(null);
      setIsEditMode(false);
      setFormDate('');
      setFormTime('');
      setFormNotes('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Handle closing the modal
  const handleModalClose = () => {
    setSelectedAppointment(null);
    setIsEditMode(false);
    setFormDate('');
    setFormTime('');
    setFormProvider('');
    setFormNotes('');
    setFormError(null);
    setFormSuccess(false);
  };

  // Handle form input changes
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormDate(e.target.value);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormTime(e.target.value);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormNotes(e.target.value);
  };

  // Handle form submission (add or edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate || !formTime || !formProvider) {
      setFormError('Date, time, and provider are required');
      return;
    }
    if (formNotes.length > 500) {
      setFormError('Notes must be 500 characters or less');
      return;
    }

    setFormLoading(true);
    setFormError(null);
    setFormSuccess(false);

    try {
      // Combine date and time and convert to UTC ISO string for storage
      const localDateTime = `${formDate}T${formTime}:00`; // YYYY-MM-DDTHH:mm:ss
      const localDateObj = new Date(localDateTime); // This is interpreted as local time
      const utcDateString = localDateObj.toISOString(); // Convert to UTC ISO string

      if (isEditMode && selectedAppointment) {
        // Update existing appointment
        const { error } = await supabase
          .from('appointments')
          .update({
            appointment_date: utcDateString,
            provider_name: formProvider,
            notes: formNotes || null,
          })
          .eq('id', selectedAppointment.id)
          .eq('user_id', user?.id);

        if (error) throw error;
      } else {
        // Insert new appointment
        const { error } = await supabase
          .from('appointments')
          .insert([
            {
              user_id: user?.id,
              provider_name: formProvider,
              appointment_date: utcDateString,
              notes: formNotes || null,
            }
          ]);

        if (error) throw error;
      }

      // Refetch appointments to update the list
      const { data, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user?.id)
        .order('appointment_date', { ascending: true });

      if (fetchError) throw fetchError;
      setAppointments(data || []);

      // Reset form and show success
      setFormDate('');
      setFormTime('');
      setFormProvider('');
      setFormNotes('');
      setFormSuccess(true);
      setFormLoading(false);

      // Close modal after a short delay
      setTimeout(() => {
        setSelectedAppointment(null);
        setIsEditMode(false);
      }, 1500);
    } catch (err: any) {
      setFormError(err.message);
      setFormLoading(false);
    }
  };

  // Split appointments into upcoming and past based on current time in UTC
  const now = new Date();
  const upcomingAppointments = appointments.filter(
    (appt) => new Date(appt.appointment_date) >= now
  );
  const pastAppointments = appointments.filter(
    (appt) => new Date(appt.appointment_date) < now
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full border-4 border-t-indigo-600 w-12 h-12"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
        <p>{error}</p>
      </div>
    );
  }

  if (!user) {
    navigate('/', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0 sm:space-x-3">
          <div className="flex items-center gap-4">
            <BackButton />
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Appointments
              </h1>
              <p className="mt-2 text-sm text-gray-500 sm:mt-0">
                Track your dental appointments and checkups
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => navigate('/tooth-chart')}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Tooth Chart
            </button>
            <button
              onClick={() => {
                // Open add form by setting a dummy selected appointment
                setSelectedAppointment({} as any);
                setIsEditMode(false);
                setFormDate('');
                setFormTime('');
                setFormProvider('');
                setFormNotes('');
                setFormError(null);
                setFormSuccess(false);
              }}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Schedule Appointment
            </button>
            <button
              onClick={handleLogout}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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

        {/* Appointments List */}
        <div className="mb-8">
          {/* Upcoming Appointments */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Upcoming Appointments
            </h2>
            {upcomingAppointments.length === 0 ? (
              <p className="text-gray-500 italic">No upcoming appointments.</p>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appt) => (
                  <div key={appt.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {appt.provider_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(appt.appointment_date).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex space-x-2 text-sm">
                        <button
                          onClick={() => handleEditSelect(appt)}
                          className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(appt.id)}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {appt.notes && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {appt.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Appointments */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Past Appointments
            </h2>
            {pastAppointments.length === 0 ? (
              <p className="text-gray-500 italic">No past appointments.</p>
            ) : (
              <div className="space-y-4">
                {pastAppointments.map((appt) => (
                  <div key={appt.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {appt.provider_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(appt.appointment_date).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex space-x-2 text-sm">
                        <button
                          onClick={() => handleEditSelect(appt)}
                          className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(appt.id)}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {appt.notes && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {appt.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Empty state for no appointments at all */}
          {appointments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-xl text-gray-500">
                No appointments yet. Schedule your first checkup.
              </p>
              <button
                onClick={() => {
                  // Open add form by setting a dummy selected appointment
                  setSelectedAppointment({} as any);
                  setIsEditMode(false);
                  setFormDate('');
                  setFormTime('');
                  setFormProvider('');
                  setFormNotes('');
                  setFormError(null);
                  setFormSuccess(false);
                }}
                className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
              >
                Schedule Appointment
              </button>
            </div>
          )}
        </div>

        {/* Add/Edit Appointment Modal */}
        {selectedAppointment !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isEditMode ? 'Edit Appointment' : 'Schedule Appointment'}
                </h2>
                <button
                  onClick={handleModalClose}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ��� � � ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-2">
                    Provider Name
                  </label>
                  <input
                    id="provider"
                    type="text"
                    value={formProvider}
                    onChange={e => setFormProvider(e.target.value)}
                    className="block w-full rounded-md border-0 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    id="date"
                    type="date"
                    value={formDate}
                    onChange={handleDateChange}
                    className="block w-full rounded-md border-0 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <select
                    id="time"
                    value={formTime}
                    onChange={handleTimeChange}
                    className="block w-full rounded-md border-0 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                  >
                    <option value="">Select time</option>
                    {timeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    id="notes"
                    value={formNotes}
                    onChange={handleNotesChange}
                    rows={3}
                    maxLength={500}
                    className="block w-full rounded-md border-0 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                  />
                </div>

                {formError && (
                  <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                    <p>{formError}</p>
                  </div>
                )}

                {formSuccess && (
                  <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4" role="alert">
                    <p>Appointment saved successfully!</p>
                  </div>
                )}

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={formLoading}
                    className={`w-full flex items-center justify-center px-5 py-3.5 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md ${formLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {formLoading ? (
                      <>
                        <svg className="h-4 w-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-14.736 0m14.736 6a8.003 8.003 0 00-14.736 0m14.736 0A8.001 8.001 0 1022.582 16m0 0h5.418m0 0a8.003 8.003 0 01-14.736 0z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      isEditMode ? 'Update Appointment' : 'Schedule Appointment'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}