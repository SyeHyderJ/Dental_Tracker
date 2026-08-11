import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';

export default function ToothChart() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [toothRecords, setToothRecords] = useState<any[]>([]); // records for selected tooth
  const [formCondition, setFormCondition] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formProvider, setFormProvider] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch all tooth records for the current user
  useEffect(() => {
    if (user) {
      const fetchRecords = async () => {
        try {
          setLoading(true);
          const { data, error } = await supabase
            .from('tooth_records')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false }); // most recent first

          if (error) throw error;
          setRecords(data || []);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchRecords();
    }
  }, [user]);

  // When records update, compute the most recent record per tooth for quick lookup
  // We'll compute this in the render for simplicity, but we can memoize if needed

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Handle selecting a tooth
  const handleToothSelect = (toothNumber: number) => {
    setSelectedTooth(toothNumber);
    // Filter records for this tooth and sort by date descending
    const toothSpecific = records
      .filter((r) => r.tooth_number === toothNumber)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setToothRecords(toothSpecific);
    // Reset form
    setFormCondition('');
    setFormNotes('');
    setFormProvider('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormError(null);
    setFormSuccess(false);
  };

  // Handle closing the modal
  const handleModalClose = () => {
    setSelectedTooth(null);
  };

  // Handle form input changes
  const handleConditionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormCondition(e.target.value);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormNotes(e.target.value);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormDate(e.target.value);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTooth) return;
    if (!formCondition) {
      setFormError('Condition is required');
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
      const { error } = await supabase
        .from('tooth_records')
        .insert([
          {
            user_id: user?.id,
            tooth_number: selectedTooth,
            condition: formCondition,
            notes: formNotes,
            date: formDate,
            provider_name: formProvider,
          }
        ]);

      if (error) throw error;

      // Refetch records to update the chart
      const { data, error: fetchError } = await supabase
        .from('tooth_records')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: false });

      if (fetchError) throw fetchError;
      setRecords(data || []);

      // Reset form and show success
      setFormCondition('');
      setFormNotes('');
      setFormDate(new Date().toISOString().split('T')[0]);
      setFormSuccess(true);
      setFormLoading(false);

      // Optionally, we can close the modal after a short delay
      // setTimeout(() => {
      //   setSelectedTooth(null);
      // }, 1500);
    } catch (err: any) {
      setFormError(err.message);
      setFormLoading(false);
    }
  };

  // Determine the status color for a tooth based on its most recent record
  const getToothStatus = (toothNumber: number): string => {
    const toothRecords = records
      .filter((r) => r.tooth_number === toothNumber)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (toothRecords.length === 0) {
      return 'gray'; // no record
    }

    const mostRecent = toothRecords[0];
    const condition = mostRecent.condition.toLowerCase();

    if (condition === 'healthy' || condition === 'filling' || condition === 'crown') {
      return 'green'; // healthy or restored
    } else if (condition === 'cavity' || condition === 'extracted') {
      return 'red'; // active issue
    } else {
      return 'yellow'; // needs attention or other
    }
  };

  // Define the tooth layout: Universal Numbering System 1-32
  // We'll split into upper and lower arches for a simple grid
  // Upper arch: teeth 1-16 (right to left from dentist's view, but we'll show patient's left to right)
  // Actually, for simplicity, we'll just show 1-32 in two rows: 1-16 upper, 17-32 lower
  // But note: Universal numbering:
  //   Upper right: 1-8 (from patient's right to left)
  //   Upper left: 9-16 (from patient's right to left)
  //   Lower left: 17-24 (from patient's left to right)
  //   Lower right: 25-32 (from patient's left to right)
  // We'll simplify and just show 1-16 in the first row (upper) and 17-32 in the second row (lower)
  // And we'll note that this is a simplification for v1.

  // We'll create arrays for the two rows
  const upperTeeth = Array.from({ length: 16 }, (_, i) => i + 1); // 1-16
  const lowerTeeth = Array.from({ length: 16 }, (_, i) => i + 17); // 17-32

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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Tooth Chart
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Click a tooth to view its history and add a new record
              </p>
            </div>
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

        {/* Tooth Chart */}
        <div className="mb-8">
          <div className="space-y-4">
            {/* Upper Arch */}
            <div className="flex flex-col items-center">
              <p className="mb-2 text-sm font-medium text-gray-600">Upper Teeth</p>
              <div className="flex flex-wrap justify-center gap-2">
                {upperTeeth.map((toothNumber) => {
                  const statusColor = getToothStatus(toothNumber);
                  const bgColor = statusColor === 'gray' ? 'bg-gray-200' :
                                  statusColor === 'green' ? 'bg-green-200' :
                                  statusColor === 'yellow' ? 'bg-yellow-200' :
                                  'bg-red-200';
                  return (
                    <button
                      key={toothNumber}
                      onClick={() => handleToothSelect(toothNumber)}
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-md ${bgColor} hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200`}
                      aria-label={`Tooth ${toothNumber}: ${statusColor}`}
                    >
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="text-xs font-medium">{toothNumber}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lower Arch */}
            <div className="flex flex-col items-center">
              <p className="mb-2 text-sm font-medium text-gray-600">Lower Teeth</p>
              <div className="flex flex-wrap justify-center gap-2">
                {lowerTeeth.map((toothNumber) => {
                  const statusColor = getToothStatus(toothNumber);
                  const bgColor = statusColor === 'gray' ? 'bg-gray-200' :
                                  statusColor === 'green' ? 'bg-green-200' :
                                  statusColor === 'yellow' ? 'bg-yellow-200' :
                                  'bg-red-200';
                  return (
                    <button
                      key={toothNumber}
                      onClick={() => handleToothSelect(toothNumber)}
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-md ${bgColor} hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200`}
                      aria-label={`Tooth ${toothNumber}: ${statusColor}`}
                    >
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="text-xs font-medium">{toothNumber}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Tooth Modal/Panel */}
        {selectedTooth !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 sm:mx-0 relative flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-start mb-4 p-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Tooth {selectedTooth}
                </h2>
                <button
                  onClick={handleModalClose}
                  className="text-gray-500 hover:text-gray-700 h-10 w-10 flex items-center justify-center rounded-md hover:bg-gray-100"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {/* Tooth Record History */}
                <div className="mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Record History
                    </h3>
                    {toothRecords.length > 1 && (
                      <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        {showHistory ? 'Show less' : 'Show all records'}
                      </button>
                    )}
                  </div>
                  {toothRecords.length === 0 ? (
                    <p className="text-gray-500 italic">No records for this tooth yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {!showHistory && toothRecords.length > 1 ? (
                        <>
                          {/* Show only the most recent record */}
                          {toothRecords.slice(0, 1).map((record) => (
                            <div key={record.id} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-gray-900">
                                  {record.condition}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {new Date(record.date).toLocaleDateString()}
                                </span>
                              </div>
                              {record.provider_name && (
                                <p className="text-sm text-gray-600">
                                  Provider: {record.provider_name}
                                </p>
                              )}
                              {record.notes && (
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {record.notes}
                                </p>
                              )}
                            </div>
                          ))}
                          <div className="text-center text-sm text-gray-500">
                            and {toothRecords.length - 1} more record{toothRecords.length !== 2 ? 's' : ''}
                          </div>
                        </>
                      ) : (
                        <>
                          {toothRecords.map((record) => (
                            <div key={record.id} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-gray-900">
                                  {record.condition}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {new Date(record.date).toLocaleDateString()}
                                </span>
                              </div>
                              {record.provider_name && (
                                <p className="text-sm text-gray-600">
                                  Provider: {record.provider_name}
                                </p>
                              )}
                              {record.notes && (
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {record.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Add Record Form */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Add New Record
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-2">
                        Provider
                      </label>
                      <input
                        id="provider"
                        type="text"
                        value={formProvider}
                        onChange={e => setFormProvider(e.target.value)}
                        className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      />
                    </div>

                    <div>
                      <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
                        Condition
                      </label>
                      <select
                        id="condition"
                        value={formCondition}
                        onChange={handleConditionChange}
                        className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      >
                        <option value="">Select condition</option>
                        <option value="Healthy">Healthy</option>
                        <option value="Cavity">Cavity</option>
                        <option value="Filling">Filling</option>
                        <option value="Crown">Crown</option>
                        <option value="Extracted">Extracted</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                        Notes
                      </label>
                      <textarea
                        id="notes"
                        value={formNotes}
                        onChange={handleNotesChange}
                        rows={3}
                        maxLength={500}
                        className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
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
                        className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      />
                    </div>

                    {formError && (
                      <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                        <p>{formError}</p>
                      </div>
                    )}

                    {formSuccess && (
                      <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4" role="alert">
                        <p>Record added successfully!</p>
                      </div>
                    )}

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={formLoading}
                        className={`w-full flex items-center justify-center px-5 py-3.5 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md transition-colors duration-200 ${formLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {formLoading ? (
                          <>
                            <svg className="h-4 w-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-14.736 0m14.736 6a8.003 8.003 0 00-14.736 0m14.736 0A8.001 8.001 0 1022.582 16m0 0h5.418m0 0a8.003 8.003 0 01-14.736 0z"></path>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          'Add Record'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}