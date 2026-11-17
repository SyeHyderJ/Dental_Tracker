import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { Spinner, ErrorBanner } from '../components/ui';

export default function Appointments() {
  const { user } = useAuth();
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

  if (loading) return <Spinner />;

  if (error) return <ErrorBanner>{error}</ErrorBanner>;

  if (!user) {
    navigate('/', { replace: true });
    return null;
  }

  
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

  return (
    <AppShell title="Appointments" subtitle="Track your dental appointments and checkups" active="care">
      {appointments.length === 0 ? (
        <div className="space-y-6">
          <p className="text-center text-sm text-slate">
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
            className="btn-primary w-full"
          >
            Schedule Appointment
          </button>
        </div>
      ) : (
        <>
          {/* Upcoming Appointments */}
          <div className="mb-6">
            <h2 className="font-heading text-lg font-semibold">
              Upcoming Appointments
            </h2>
            {upcomingAppointments.length === 0 ? (
              <p className="text-sm text-slate">
                No upcoming appointments.
              </p>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appt) => (
                  <div key={appt.id} className="surface-card p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-mono text-sm font-semibold">
                          {appt.provider_name}
                        </h3>
                        <p className="text-sm text-slate">
                          {new Date(appt.appointment_date).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex space-x-2 text-sm">
                        <button
                          onClick={() => handleEditSelect(appt)}
                          className="btn-secondary px-3 py-1 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(appt.id)}
                          className="btn-secondary px-3 py-1 text-sm text-destructive"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {appt.notes && (
                      <p className="text-sm text-slate line-clamp-2">
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
            <h2 className="font-heading text-lg font-semibold">
              Past Appointments
            </h2>
            {pastAppointments.length === 0 ? (
              <p className="text-sm text-slate">
                No past appointments.
              </p>
            ) : (
              <div className="space-y-4">
                {pastAppointments.map((appt) => (
                  <div key={appt.id} className="surface-card p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-mono text-sm font-semibold">
                          {appt.provider_name}
                        </h3>
                        <p className="text-sm text-slate">
                          {new Date(appt.appointment_date).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex space-x-2 text-sm">
                        <button
                          onClick={() => handleEditSelect(appt)}
                          className="btn-secondary px-3 py-1 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(appt.id)}
                          className="btn-secondary px-3 py-1 text-sm text-destructive"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {appt.notes && (
                      <p className="text-sm text-slate line-clamp-2">
                        {appt.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Button to add new appointment */}
          <div className="mt-6">
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
              className="btn-secondary w-full"
            >
              Schedule New Appointment
            </button>
          </div>
        </>
      )}

      {/* Add/Edit Appointment Modal */}
      {selectedAppointment !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="surface-card w-full max-w-md p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="font-heading text-lg font-semibold">
                {isEditMode ? 'Edit Appointment' : 'Schedule Appointment'}
              </h2>
              <button
                onClick={handleModalClose}
                className="btn-secondary"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="provider" className="block text-sm font-medium text-ink">
                  Provider Name
                </label>
                <input
                  id="provider"
                  type="text"
                  value={formProvider}
                  onChange={e => setFormProvider(e.target.value)}
                  className="field-input"
                />
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-ink">
                  Date
                </label>
                <input
                  id="date"
                  type="date"
                  value={formDate}
                  onChange={handleDateChange}
                  className="field-input"
                />
              </div>

              <div>
                <label htmlFor="time" className="block text-sm font-medium text-ink">
                  Time
                </label>
                <select
                  id="time"
                  value={formTime}
                  onChange={handleTimeChange}
                  className="field-input"
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
                <label htmlFor="notes" className="block text-sm font-medium text-ink">
                  Notes (optional)
                </label>
                <textarea
                  id="notes"
                  value={formNotes}
                  onChange={handleNotesChange}
                  rows={3}
                  maxLength={500}
                  className="field-input"
                />
              </div>

              {formError && <ErrorBanner>{formError}</ErrorBanner>}

              {formSuccess && (
                <p className="text-sm text-healthy">
                  Appointment saved successfully!
                </p>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="btn-primary"
                >
                  {formLoading ? 'Saving...' : (isEditMode ? 'Update Appointment' : 'Schedule Appointment')}
                </button>
                <button
                  type="button"
                  className="btn-secondary w-full mt-3"
                  onClick={handleModalClose}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}