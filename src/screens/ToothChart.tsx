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