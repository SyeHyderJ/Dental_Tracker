import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { Spinner, ErrorBanner } from '../components/ui';

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
  const { user } = useAuth();
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

  if (loading) return <Spinner />;

  if (error) return <ErrorBanner>{error}</ErrorBanner>;

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
    <AppShell title="Dental Records" subtitle="View all your dental health records" active="records">
      {records.length === 0 ? (
        <div className="space-y-6">
          <p className="text-center text-sm text-slate">
            No records yet. Add your first record from the Tooth Chart.
          </p>
          <button
            onClick={() => navigate('/tooth-chart')}
            className="btn-primary w-full"
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

            // Helper to get condition color class
            const getConditionColorClass = (condition: string) => {
              const lower = condition.toLowerCase();
              if (lower === 'healthy' || lower === 'filling' || lower === 'crown') {
                return 'bg-healthy-soft text-healthy';
              } else if (lower === 'cavity' || lower === 'extracted') {
                return 'bg-warning-soft text-warning';
              } else {
                return 'bg-surface-container-low text-ink';
              }
            };
            const conditionColorClass = getConditionColorClass(mostRecentRecord.condition);

            return (
              <div key={toothNumber} className="surface-card p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h2 className="font-heading text-lg font-semibold">
                      Tooth #{toothNumber}
                    </h2>
                    <p className="text-sm text-slate">
                      {new Date(mostRecentRecord.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-sm text-slate">
                    {mostRecentRecord.provider_name && (
                      <>
                        <span className={`rounded-2xl p-1 ${conditionColorClass}`}>
                          {mostRecentRecord.provider_name}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className={`rounded-2xl p-2 ${conditionColorClass}`}></div>
                    <span className="font-mono text-sm font-medium capitalize">
                      {mostRecentRecord.condition}
                    </span>
                  </div>

                  {mostRecentRecord.notes && (
                    <p className="text-sm text-slate line-clamp-3">
                      {mostRecentRecord.notes}
                    </p>
                  )}

                  {/* Toggle to show/hide full history */}
                  {sortedRecords.length > 1 && (
                    <div className="pt-4 border-t border-border">
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
                        className="w-full text-left text-sm font-medium text-slate hover:text-ink flex items-center"
                      >
                        <>
                          {isExpanded ? 'Show less' : `Show all ${sortedRecords.length} records`}
                          <svg
                            className="ml-2 h-4 w-4 transition-transform"
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
                    <div className="mt-4 space-y-3">
                      <h3 className="font-heading text-sm font-semibold">
                        Full History
                      </h3>
                      {sortedRecords.map((record) => (
                        <div key={record.id} className="surface-card p-3 mb-2">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-mono text-sm">{record.condition}</span>
                            <span className="text-sm text-slate">
                              {new Date(record.date).toLocaleDateString()}
                            </span>
                          </div>
                          {record.provider_name && (
                            <p className="text-sm text-slate">
                              Provider: {record.provider_name}
                            </p>
                          )}
                          {record.notes && (
                            <p className="text-sm text-slate line-clamp-2">
                              {record.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={() => navigate('/tooth-chart')}
        className="btn-secondary w-full mt-6"
      >
        Add New Record
      </button>
    </AppShell>
  );
}