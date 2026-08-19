import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';

interface ToothRecord {
  id: string;
  user_id: string;
  tooth_number: number;
  condition: string;
  notes?: string | null;
  date: string; // ISO date string
  created_at?: string;
  provider_name?: string | null;
}

export default function Records() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<ToothRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTeeth, setExpandedTeeth] = useState<Set<number>>(new Set());

  // Fetch all records for the current user
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

  // Handle logout
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

  if (error) {
    return (
      <div className="bg-red-50 border-l-2 border-red-500 text-red-700 p-4 mb-6" role="alert">
        <p>{error}</p>
      </div>
    );
  }

  if (!user) {
    navigate('/', { replace: true });
    return null;
  }

  // Group records by tooth number
  const recordsByTooth = records.reduce((acc, record) => {
    const toothNum = record.tooth_number;
    if (!acc[toothNum]) {
      acc[toothNum] = [];
    }
    acc[toothNum].push(record);
    return acc;
  }, {} as Record<string, ToothRecord[]>);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Dental Records
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                View all your dental health records
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
          <div className="bg-red-50 border-l-2 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{error}</p>
          </div>
        )}

        {/* Records List */}
        <div className="mb-8">
          {records.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-500">
                No records yet. Add your first record from the Tooth Chart.
              </p>
              <button
                onClick={() => navigate('/tooth-chart')}
                className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
              >
                Go to Tooth Chart
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(recordsByTooth).map(([toothNumberStr, toothRecords]) => {
                const toothNumber = parseInt(toothNumberStr, 10);
                // Sort records for this tooth by date descending (most recent first)
                const sortedRecords = [...toothRecords].sort(
                  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                );

                const isExpanded = expandedTeeth.has(toothNumber);
                const mostRecentRecord = sortedRecords[0];

                // Determine color class based on condition
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
                const conditionColorClass = getConditionColorClass(mostRecentRecord.condition);

                return (
                  <div key={toothNumber} className="bg-white rounded-lg shadow-xl p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          Tooth #{toothNumber}
                        </h2>
                        <p className="text-sm text-gray-500">
                          {new Date(mostRecentRecord.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-sm text-gray-600">
                        {mostRecentRecord.provider_name && (
                          <>
                            <span className="bg-gray-200 px-2 py-1 rounded text-xs">
                              {mostRecentRecord.provider_name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className={`h-3 w-3 rounded-full ${conditionColorClass}`}></div>
                        <span className="font-medium text-gray-900 capitalize">
                          {mostRecentRecord.condition}
                        </span>
                      </div>

                      {mostRecentRecord.notes && (
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {mostRecentRecord.notes}
                        </p>
                      )}
                    </div>

                    {/* Toggle to show/hide full history */}
                    {sortedRecords.length > 1 && (
                      <div className="pt-4 border-t">
                        <button
                          onClick={() => {
                            if (isExpanded) {
                              setExpandedTeeth(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(toothNumber);
                                return newSet;
                              });
                            } else {
                              setExpandedTeeth(prev => {
                                const newSet = new Set(prev);
                                newSet.add(toothNumber);
                                return newSet;
                              });
                            }
                          }}
                          className="w-full text-left text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center"
                        >
                          <>
                            {isExpanded ? 'Show less' : `Show all ${sortedRecords.length} records`}
                            <svg className="ml-2 h-4 w-4 transition-transform"
                                 xmlns="http://www.w3.org/2000/svg"
                                 fill="none"
                                 viewBox="0 0 24 24"
                                 stroke="currentColor"
                                 transform={isExpanded ? 'rotate(180)' : 'rotate(0)'}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round"
                                    d="M19 9l-7 7-7-7"/>
                            </svg>
                          </>
                        </button>
                      </div>
                    )}

                    {/* Full history section (conditionally rendered) */}
                    {isExpanded && sortedRecords.length > 1 && (
                      <div className="mt-6 space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Full History
                        </h3>
                        {sortedRecords.map((record) => (
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
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}