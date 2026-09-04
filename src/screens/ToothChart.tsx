import { useEffect, useState } from 'react';
import React from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { ErrorBanner, Field, Spinner } from '../components/ui';

export default function ToothChart() {
  const { user } = useAuth();
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
  const [viewMode, setViewMode] = useState<'arch' | 'list'>('arch'); // default to arch view

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

  // Handle form input changes
  const handleConditionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormCondition(e.target.value);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormNotes(e.target.value);
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormProvider(e.target.value);
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

  // Helper to get the condition for a tooth (most recent or 'healthy' if none)
  const getToothCondition = (toothNumber: number): string => {
    const toothRecords = records
      .filter((r) => r.tooth_number === toothNumber)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (toothRecords.length === 0) {
      return 'healthy';
    }
    return toothRecords[0].condition;
  };

  // Helper to get background class for a tooth based on condition
  const getToothBackgroundClass = (condition: string): string => {
    const c = condition.toLowerCase();
    if (c === 'healthy') return 'bg-healthy-soft text-healthy';
    if (c === 'filling') return 'bg-filling-soft text-filling';
    if (c === 'crown') return 'bg-crown-soft text-crown';
    if (c === 'cavity' || c === 'extracted' || c === 'needs-attention') return 'bg-warning-soft text-warning';
    return 'bg-surface-container-low text-ink';
  };

  // Helper to determine if we should show a dot indicator
  const shouldShowDot = (condition: string): boolean => {
    const c = condition.toLowerCase();
    return c === 'cavity' || c === 'needs-attention' || c === 'extracted';
  };

  // Helper to get dot color class (white for visibility on red background)
  const getDotColorClass = (condition: string): string => {
    const c = condition.toLowerCase();
    if (c === 'cavity' || c === 'extracted' || c === 'needs-attention') {
      return 'bg-on-destructive'; // white
    }
    return 'bg-muted/50'; // fallback
  };

  // Define the tooth layout: Universal Numbering System 1-32
  // Split into upper and lower arches, each with two rows
  const upperTeethRow1 = Array.from({ length: 8 }, (_, i) => i + 1); // 1-8
  const upperTeethRow2 = Array.from({ length: 8 }, (_, i) => i + 9); // 9-16
  const lowerTeethRow1 = Array.from({ length: 8 }, (_, i) => i + 17); // 17-24
  const lowerTeethRow2 = Array.from({ length: 8 }, (_, i) => i + 25); // 25-32

  if (loading) return <Spinner />;

  if (!user) {
    navigate('/', { replace: true });
    return null;
  }

  const lastUpdated = records.length > 0
    ? new Date(records[0].date).toLocaleDateString()
    : 'No records yet';

  const renderArch = (teeth: number[]) => (
    <div className="grid grid-cols-8 gap-1.5">
      {teeth.map((toothNumber) => {
        const condition = getToothCondition(toothNumber);
        const selected = selectedTooth === toothNumber;
        return (
          <button
            key={toothNumber}
            type="button"
            onClick={() => handleToothSelect(toothNumber)}
            className={`relative h-11 rounded-xl font-mono text-xs ${getToothBackgroundClass(condition)} ${
              selected ? 'ring-2 ring-primary' : ''
            }`}
            aria-label={`Tooth ${toothNumber}: ${condition}`}
          >
            {toothNumber}
            {shouldShowDot(condition) ? (
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-warning" />
            ) : null}
          </button>
        );
      })}
    </div>
  );

  return (
    <AppShell title="Dental chart" subtitle={`Updated ${lastUpdated}`} active="chart">
      {error ? <ErrorBanner>{error}</ErrorBanner> : null}

      <div className="mb-4 flex rounded-full bg-surface-container-low p-1">
        <button
          type="button"
          onClick={() => setViewMode('arch')}
          className={`flex-1 rounded-full py-2 text-sm font-semibold ${viewMode === 'arch' ? 'bg-card text-ink' : 'text-slate'}`}
        >
          Arch
        </button>
        <button
          type="button"
          onClick={() => setViewMode('list')}
          className={`flex-1 rounded-full py-2 text-sm font-semibold ${viewMode === 'list' ? 'bg-card text-ink' : 'text-slate'}`}
        >
          List
        </button>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-2">
          {Array.from({ length: 32 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleToothSelect(n)}
              className="surface-card flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="font-mono text-sm">Tooth {n}</span>
              <span className="text-sm capitalize text-slate">{getToothCondition(n)}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="surface-card space-y-5 p-4">
          <p className="text-center text-xs font-medium text-slate">Upper arch</p>
          {renderArch(upperTeethRow1)}
          {renderArch(upperTeethRow2)}
          <div className="h-px bg-border" />
          <p className="text-center text-xs font-medium text-slate">Lower arch</p>
          {renderArch(lowerTeethRow1)}
          {renderArch(lowerTeethRow2)}
          <div className="flex flex-wrap justify-center gap-4 pt-2 text-xs text-slate">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-healthy" /> Healthy</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-filling" /> Filling</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-crown" /> Crown</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-warning" /> Needs care</span>
          </div>
        </div>
      )}

      <div className="mt-5 surface-card p-4">
        {!selectedTooth ? (
          <p className="py-6 text-center text-sm text-slate">Select a tooth to add a record.</p>
        ) : (
          <>
            <h2 className="font-heading text-xl font-semibold">Tooth {selectedTooth}</h2>
            <p className="mt-1 font-mono text-sm text-slate">
              {toothRecords.length > 0
                ? `${toothRecords[0].condition} · ${new Date(toothRecords[0].date).toLocaleDateString()}`
                : 'No records yet'}
            </p>
            {toothRecords[0]?.notes ? (
              <p className="mt-3 rounded-xl bg-porcelain p-3 text-sm">{toothRecords[0].notes}</p>
            ) : null}

            <h3 className="mt-5 text-sm font-semibold">History</h3>
            {toothRecords.length === 0 ? (
              <p className="mt-2 text-sm text-slate">Nothing logged for this tooth.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {toothRecords.map((record) => (
                  <li key={record.id} className="rounded-xl bg-porcelain px-3 py-2">
                    <p className="capitalize">{record.condition}</p>
                    <p className="font-mono text-xs text-slate">{new Date(record.date).toLocaleDateString()}</p>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <Field id="condition" label="Condition">
                <select id="condition" value={formCondition} onChange={handleConditionChange} className="field-input">
                  <option value="">Select a condition</option>
                  <option value="healthy">Healthy</option>
                  <option value="filling">Filling</option>
                  <option value="crown">Crown</option>
                  <option value="cavity">Cavity</option>
                  <option value="extracted">Extracted</option>
                  <option value="needs-attention">Needs attention</option>
                </select>
              </Field>
              <Field id="notes" label="Notes">
                <textarea id="notes" value={formNotes} onChange={handleNotesChange} className="field-input" rows={3} />
              </Field>
              <Field id="provider" label="Provider">
                <input id="provider" value={formProvider} onChange={handleProviderChange} className="field-input" />
              </Field>
              <Field id="date" label="Date">
                <input id="date" type="date" value={formDate} onChange={handleDateChange} className="field-input" />
              </Field>
              {formError ? <ErrorBanner>{formError}</ErrorBanner> : null}
              {formSuccess ? <p className="text-sm text-healthy">Record saved.</p> : null}
              <button type="submit" disabled={formLoading} className="btn-primary">
                {formLoading ? 'Saving...' : 'Save record'}
              </button>
              <button type="button" className="btn-secondary w-full" onClick={() => navigate('/appointments')}>
                Schedule visit
              </button>
            </form>
          </>
        )}
      </div>
    </AppShell>
  );
}

function _unusedNavRemoved() {
  return (
    <div className="hidden">
      {/* TOP NAV BAR */}
      <nav className="bg-primary text-on-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-4">
          {/* Left: circular avatar image placeholder */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-on-primary/20 flex items-center justify-center">
              <span className="text-on-primary">A</span>
            </div>
            <div className="hidden md:flex space-x-4 text-sm font-medium">
              {/* Nav links: Home / History / Chart / Settings */}
              <button
                onClick={() => navigate('/', { replace: true })}
                className="hover:text-on-primary/80 transition-colors p-1"
              >
                Home
              </button>
              <button
                onClick={() => navigate('/records', { replace: true })}
                className="hover:text-on-primary/80 transition-colors p-1"
              >
                History
              </button>
              <button
                onClick={() => navigate('/tooth-chart', { replace: true })}
                className="text-on-primary bg-on-primary/20 px-3 py-1 rounded-full"
              >
                Chart
              </button>
              <button
                onClick={() => navigate('/share-access', { replace: true })}
                className="hover:text-on-primary/80 transition-colors p-1"
              >
                Settings
              </button>
            </div>
          </div>

          {/* Center: DentalTracker wordmark */}
          <div className="flex items-center">
            <h1 className="text-2xl font-heading text-on-primary">
              DentalTracker
            </h1>
          </div>

          {/* Right: lock icon */}
          <div className="flex items-center">
            <div className="h-8 w-8 flex items-center justify-center bg-on-primary/20 rounded-full">
              <span className="text-on-primary">🔒</span>
            </div>
          </div>
        </div>
      </nav>

      {/* PAGE CONTENT */}
      <div className="flex-1 flex px-4 sm:px-6 lg:px-8">
        {/* PAGE HEADER */}
        <div className="flex-1 flex flex-col bg-background">
          <header className="mb-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h2 className="text-4xl font-heading text-on-background">
                  Clinical Chart
                </h2>
                <p className="text-sm text-on-background/60 flex items-center">
                  <span className="mr-1">⏰</span>
                  Last updated: Today, {lastUpdated}
                </p>
              </div>

              {/* TOGGLE CONTROL: top-right of the content area */}
              <div className="flex items-center space-x-2">
                {/* Segmented control for Arch View / List View */}
                <div className="relative inline-flex h-10 px-2 bg-muted/50 rounded-full shadow-inner">
                  {/* Track */}
                  <div className="absolute inset-0 bg-muted/30 rounded-full"></div>
                  {/* Active indicator */}
                  <div className={`absolute inset-0 flex items-center ${viewMode === 'arch' ? 'left-0' : 'right-0'} w-1/2 h-full bg-card rounded-full transition-transform duration-200`}></div>
                  {/* Buttons */}
                  <button
                    onClick={() => setViewMode('arch')}
                    className={`flex-1 relative z-10 flex items-center justify-center text-sm font-medium text-on-background/60 ${viewMode === 'arch' ? 'text-on-background' : ''} hover:bg-muted/40`}
                  >
                    Arch View
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex-1 relative z-10 flex items-center justify-center text-sm font-medium text-on-background/60 ${viewMode === 'list' ? 'text-on-background' : ''} hover:bg-muted/40`}
                  >
                    List View
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* MAIN CONTENT - two-column layout */}
          <div className="flex-1 flex flex-col sm:flex-row gap-6">
            {/* LEFT: TOOTH GRID (larger card) */}
            <div className="flex-1 bg-card rounded-lg shadow-lg p-6">
              <div className="space-y-6">
                {/* MAXILLARY ARCH (UPPER) */}
                <div className="text-center text-sm font-medium text-on-background/60 text-uppercase">
                  MAXILLARY ARCH (UPPER)
                </div>
                <div className="grid grid-cols-8 gap-2 mb-6">
                  {upperTeethRow1.map((toothNumber) => {
                    const condition = getToothCondition(toothNumber);
                    return (
                      <button
                        key={toothNumber}
                        onClick={() => handleToothSelect(toothNumber)}
                        className={`w-full h-12 rounded-md ${getToothBackgroundClass(condition)} hover:bg-opacity-80 focus:outline-none focus:ring-2 focus-ring-ring focus-ring-offset-2 transition-colors duration-200`}
                        aria-label={`Tooth ${toothNumber}: ${condition}`}
                      >
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="text-xs font-medium text-on-background">{toothNumber}</span>
                          {shouldShowDot(condition) && (
                            <div className={`absolute right-1 top-1 h-2 w-2 rounded-full ${getDotColorClass(condition)}`} />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="grid grid-cols-8 gap-2 mb-6">
                  {upperTeethRow2.map((toothNumber) => {
                    const condition = getToothCondition(toothNumber);
                    return (
                      <button
                        key={toothNumber}
                        onClick={() => handleToothSelect(toothNumber)}
                        className={`w-full h-12 rounded-md ${getToothBackgroundClass(condition)} hover:bg-opacity-80 focus:outline-none focus:ring-2 focus-ring-ring focus-ring-offset-2 transition-colors duration-200`}
                        aria-label={`Tooth ${toothNumber}: ${condition}`}
                      >
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="text-xs font-medium text-on-background">{toothNumber}</span>
                          {shouldShowDot(condition) && (
                            <div className={`absolute right-1 top-1 h-2 w-2 rounded-full ${getDotColorClass(condition)}`} />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {/* Divider line */}
                <div className="h-px bg-muted/20 mb-6"></div>
                {/* MANDIBULAR ARCH (LOWER) */}
                <div className="text-center text-sm font-medium text-on-background/60 text-uppercase mb-4">
                  MANDIBULAR ARCH (LOWER)
                </div>
                <div className="grid grid-cols-8 gap-2 mb-6">
                  {lowerTeethRow1.map((toothNumber) => {
                    const condition = getToothCondition(toothNumber);
                    return (
                      <button
                        key={toothNumber}
                        onClick={() => handleToothSelect(toothNumber)}
                        className={`w-full h-12 rounded-md ${getToothBackgroundClass(condition)} hover:bg-opacity-80 focus:outline-none focus:ring-2 focus-ring-ring focus-ring-offset-2 transition-colors duration-200`}
                        aria-label={`Tooth ${toothNumber}: ${condition}`}
                      >
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="text-xs font-medium text-on-background">{toothNumber}</span>
                          {shouldShowDot(condition) && (
                            <div className={`absolute right-1 top-1 h-2 w-2 rounded-full ${getDotColorClass(condition)}`} />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="grid grid-cols-8 gap-2 mb-6">
                  {lowerTeethRow2.map((toothNumber) => {
                    const condition = getToothCondition(toothNumber);
                    return (
                      <button
                        key={toothNumber}
                        onClick={() => handleToothSelect(toothNumber)}
                        className={`w-full h-12 rounded-md ${getToothBackgroundClass(condition)} hover:bg-opacity-80 focus:outline-none focus:ring-2 focus-ring-ring focus-ring-offset-2 transition-colors duration-200`}
                        aria-label={`Tooth ${toothNumber}: ${condition}`}
                      >
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="text-xs font-medium text-on-background">{toothNumber}</span>
                          {shouldShowDot(condition) && (
                            <div className={`absolute right-1 top-1 h-2 w-2 rounded-full ${getDotColorClass(condition)}`} />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {/* Legend row at the bottom */}
                <div className="flex items-center justify-center space-x-6 mt-6 text-sm text-on-background/60">
                  {/* Healthy */}
                  <div className="flex items-center space-x-2">
                    <div className="h-3 w-3 rounded-full bg-secondary" />
                    <span>Healthy</span>
                  </div>
                  {/* Filling */}
                  <div className="flex items-center space-x-2">
                    <div className="h-3 w-3 rounded-full bg-tertiary" />
                    <span>Filling</span>
                  </div>
                  {/* Crown */}
                  <div className="flex items-center space-x-2">
                    <div className="h-3 w-3 rounded-full bg-secondary" />
                    <span>Crown</span>
                  </div>
                  {/* Needs Attention */}
                  <div className="flex items-center space-x-2">
                    <div className="h-3 w-3 rounded-full bg-destructive" />
                    <span>Needs Attention</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: TOOTH DETAIL (narrower card) */}
            <div className="w-64 flex-shrink-0 bg-card rounded-lg shadow-lg p-6">
              {/* Empty state when no tooth selected */}
              {!selectedTooth ? (
                <div className="text-center py-12">
                  <p className="text-on-background/60">
                    Select a tooth to view details and add a record
                  </p>
                </div>
              ) : (
                <>
                  {/* Red "ACTION REQUIRED" banner if needed */}
                  {toothRecords.length > 0 && (
                    <>
                      {toothRecords[0].condition.toLowerCase() === 'cavity' || toothRecords[0].condition.toLowerCase() === 'needs-attention' ? (
                        <div className="mb-4 p-3 bg-destructive/20 text-destructive rounded-lg text-sm font-medium">
                          ACTION REQUIRED: Tooth {selectedTooth}
                        </div>
                      ) : null}
                    </>
                  )}
                  {/* Tooth name/number as heading */}
                  <h3 className="text-2xl font-heading text-on-background mb-2">
                    Tooth {selectedTooth}
                  </h3>
                  {/* Description/date line */}
                  <p className="text-sm text-on-background/60 mb-4">
                    {toothRecords.length > 0
                      ? `${toothRecords[0].condition} • ${new Date(toothRecords[0].date).toLocaleDateString()}`
                      : 'No records yet'}
                  </p>
                  {/* Highlighted note box */}
                  {toothRecords.length > 0 && toothRecords[0].notes && (
                    <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-on-background">{toothRecords[0].notes}</p>
                    </div>
                  )}
                  {/* Treatment History section */}
                  <div className="mb-6">
                    <h3 className="text-lg font-heading text-on-background mb-2">
                      Treatment History
                    </h3>
                    {toothRecords.length === 0 ? (
                      <p className="text-on-background/60">No treatment history</p>
                    ) : (
                      <div className="space-y-3">
                        {toothRecords.map((record) => (
                          <div key={record.id} className="flex items-center space-x-3 p-3 bg-muted/20 rounded-lg">
                            {/* Dot */}
                            <div
                              className={`h-2.5 w-2.5 rounded-full ${getDotColorClass(
                                record.condition.toLowerCase()
                              )}`}
                            />
                            <div className="flex-1">
                              <p className="text-sm text-on-background/60">
                                {record.condition}
                              </p>
                              <p className="text-xs text-on-background/50">
                                {new Date(record.date).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Form for adding a new record */}
                  <div className="mt-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="condition" className="block text-sm font-medium text-on-background">
                          Condition
                        </label>
                        <select
                          id="condition"
                          value={formCondition}
                          onChange={handleConditionChange}
                          className="block w-full pl-3 pr-3 py-2 bg-card border border-outline-variant rounded-md text-on-background placeholder-text-on-background/50 focus:outline-none focus:ring-2 focus-ring-ring focus-ring-offset-2"
                        >
                          <option value="">Select a condition</option>
                          <option value="healthy">Healthy</option>
                          <option value="filling">Filling</option>
                          <option value="crown">Crown</option>
                          <option value="cavity">Cavity</option>
                          <option value="extracted">Extracted</option>
                          <option value="needs-attention">Needs Attention</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="notes" className="block text-sm font-medium text-on-background">
                          Notes (optional)
                        </label>
                        <textarea
                          id="notes"
                          value={formNotes}
                          onChange={handleNotesChange}
                          className="block w-full pl-3 pr-3 py-2 bg-card border border-outline-variant rounded-md text-on-background placeholder-text-on-background/50 focus:outline-none focus:ring-2 focus-ring-ring focus-ring-offset-2"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="provider" className="block text-sm font-medium text-on-background">
                          Provider (optional)
                        </label>
                        <input
                          id="provider"
                          value={formProvider}
                          onChange={handleProviderChange}
                          className="block w-full pl-3 pr-3 py-2 bg-card border border-outline-variant rounded-md text-on-background placeholder-text-on-background/50 focus:outline-none focus:ring-2 focus-ring-ring focus-ring-offset-2"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="date" className="block text-label-md font-medium text-on-background">
                          Date
                        </label>
                        <input
                          id="date"
                          type="date"
                          value={formDate}
                          onChange={handleDateChange}
                          className="block w-full pl-3 pr-3 py-2 bg-card border border-outline-variant rounded-md text-on-background placeholder-text-on-background/50 focus:outline-none focus:ring-2 focus-ring-ring focus-ring-offset-2"
                        />
                      </div>
                      <div className="flex items-center justify-center">
                        <button
                          type="submit"
                          disabled={formLoading}
                          className="w-full flex items-center justify-center px-5 py-3 text-on-primary font-medium bg-primary text-on-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus-ring-ring focus-ring-offset-2 disabled:bg-primary/50"
                        >
                          {formLoading ? (
                            <React.Fragment>
                              {/* Loading spinner */}
                              <div className="animate-spin h-4 w-4 mr-2"></div>
                              Adding...
                            </React.Fragment>
                          ) : (
                            <React.Fragment>
                              <span className="mr-2">📝</span>
                              Add Record
                            </React.Fragment>
                          )}
                        </button>
                      </div>
                      {formError && (
                        <p className="mt-2 text-sm text-destructive">{formError}</p>
                      )}
                      {formSuccess && (
                        <p className="mt-2 text-sm text-secondary">
                          Record added successfully!
                        </p>
                      )}
                    </form>
                  </div>
                  {/* Full-width dark button "Schedule Treatment" */}
                  <div className="mt-6">
                    <button
                      onClick={() => navigate('/appointments')}
                      className="w-full flex items-center justify-center px-5 py-3 text-on-primary font-medium bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus-ring-ring focus-ring-offset-2"
                    >
                      <span className="mr-2">📅</span>
                      Schedule Treatment
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}