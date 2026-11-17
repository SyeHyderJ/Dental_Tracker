/** ToothRecordForm - Add/edit record form for selected tooth */

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useToothChart } from '../../context/ToothChartContext';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { getConditionLabel, formatRecordDate, getToothType, getToothTypeColor, getToothTypeLabel } from '../../lib/tooth-utils';
import { ErrorBanner } from '../ui';
import { Field } from '../ui';
import type { SectionId, ToothCondition } from '../../types/tooth-chart';

interface ToothRecordFormProps {
  section: { id: SectionId; teeth: number[] };
  onClose: () => void;
}

export default function ToothRecordForm({ section, onClose }: ToothRecordFormProps) {
  const { user } = useAuth();
  const {
    selectedTooth,
    getToothRecords,
    refreshRecords,
    clearSelection,
  } = useToothChart();

  const [formCondition, setFormCondition] = useState<ToothCondition | ''>('');
  const [formNotes, setFormNotes] = useState('');
  const [formProvider, setFormProvider] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // Get current tooth's records
  const toothRecords = selectedTooth ? getToothRecords(selectedTooth) : [];

  // Reset form when selected tooth changes
  const resetForm = () => {
    setFormCondition('');
    setFormNotes('');
    setFormProvider('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormError(null);
    setFormSuccess(false);
  };

  // Update form when selection changes
  // Note: We keep form blank for new records, but could pre-fill with latest

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTooth || !user) return;
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
      const { error } = await supabase.from('tooth_records').insert([
        {
          user_id: user.id,
          tooth_number: selectedTooth,
          condition: formCondition,
          notes: formNotes || null,
          date: formDate,
          provider_name: formProvider || null,
        },
      ]);

      if (error) throw error;

      // Refresh records to update the chart
      await refreshRecords();

      // Reset form and show success
      resetForm();
      setFormSuccess(true);
      setFormLoading(false);

      // Auto-clear success after delay
      setTimeout(() => setFormSuccess(false), 2000);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save record');
      setFormLoading(false);
    }
  };

  if (!selectedTooth || !section.teeth.includes(selectedTooth)) {
    return (
      <div className="surface-card p-6 text-center" role="status">
        <p className="text-sm text-slate">Select a tooth from the section above to add a record.</p>
      </div>
    );
  }

  const latestRecord = toothRecords[0];

  // Get tooth type info for visual
  const toothType = selectedTooth ? getToothType(selectedTooth) : 'incisor';
  const toothTypeLabel = getToothTypeLabel(toothType);
  const toothTypeColor = getToothTypeColor(toothType);

  return (
    <div className="surface-card p-4 space-y-4" data-testid="tooth-record-form">
      {/* Tooth header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-semibold">Tooth {selectedTooth}</h2>
          <p className="mt-1 font-mono text-sm text-slate">
            {latestRecord
              ? `${getConditionLabel(latestRecord.condition as ToothCondition)} · ${formatRecordDate(latestRecord.date)}`
              : 'No records yet'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            clearSelection();
            onClose();
          }}
          className="p-2 rounded-xl text-slate hover:bg-surface-container-low hover:text-ink transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label="Close tooth detail"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Selected tooth visual */}
      <SelectedToothVisual
        toothNumber={selectedTooth}
        type={toothType}
        typeLabel={toothTypeLabel}
        typeColor={toothTypeColor}
        isUpper={section.id.startsWith('upper')}
      />

      {/* Latest record notes preview */}
      {latestRecord?.notes && (
        <div className="rounded-xl bg-porcelain p-3 text-sm text-ink">
          {latestRecord.notes}
        </div>
      )}

      {/* History */}
      <div>
        <h3 className="text-sm font-semibold text-ink">History</h3>
        {toothRecords.length === 0 ? (
          <p className="mt-2 text-sm text-slate">Nothing logged for this tooth.</p>
        ) : (
          <ul className="mt-2 space-y-2 max-h-40 overflow-y-auto" role="list">
            {toothRecords.map((record) => (
              <li key={record.id} className="rounded-xl bg-porcelain px-3 py-2">
                <p className="capitalize text-sm">{getConditionLabel(record.condition as ToothCondition)}</p>
                <p className="font-mono text-xs text-slate">{formatRecordDate(record.date)}</p>
                {record.provider_name && (
                  <p className="font-mono text-xs text-slate">Dr. {record.provider_name}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add record form */}
      <form onSubmit={handleSubmit} className="space-y-4 border-t border-border pt-4">
        <Field id="condition" label="Condition">
          <select
            id="condition"
            value={formCondition}
            onChange={(e) => setFormCondition(e.target.value as ToothCondition)}
            className="field-input"
            required
          >
            <option value="">Select a condition</option>
            <option value="healthy">Healthy</option>
            <option value="filling">Filling</option>
            <option value="crown">Crown</option>
            <option value="cavity">Cavity</option>
            <option value="extracted">Extracted</option>
            <option value="needs-attention">Needs attention</option>
          </select>
        </Field>

        <Field id="notes" label="Notes (optional)">
          <textarea
            id="notes"
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
            className="field-input"
            rows={3}
            maxLength={500}
            placeholder="Add details about this tooth..."
          />
          <p className="mt-1 text-right text-xs text-slate">
            {formNotes.length}/500
          </p>
        </Field>

        <Field id="provider" label="Provider (optional)">
          <input
            id="provider"
            type="text"
            value={formProvider}
            onChange={(e) => setFormProvider(e.target.value)}
            className="field-input"
            placeholder="e.g., Dr. Smith"
            maxLength={100}
          />
        </Field>

        <Field id="date" label="Date">
          <input
            id="date"
            type="date"
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
            className="field-input"
            max={new Date().toISOString().split('T')[0]}
          />
        </Field>

        {formError && <ErrorBanner>{formError}</ErrorBanner>}
        {formSuccess && <p className="text-sm text-healthy" role="status">Record saved.</p>}

        <button type="submit" disabled={formLoading} className="btn-primary w-full">
          {formLoading ? 'Saving...' : 'Save record'}
        </button>

        <button
          type="button"
          className="btn-secondary w-full"
          onClick={() => {
            clearSelection();
            onClose();
          }}
        >
          Done
        </button>
      </form>
    </div>
  );
}

/** Visual representation of a single selected tooth */
function SelectedToothVisual({
  toothNumber,
  type,
  typeLabel,
  typeColor,
  isUpper,
}: {
  toothNumber: number;
  type: 'molar' | 'premolar' | 'canine' | 'incisor';
  typeLabel: string;
  typeColor: string;
  isUpper: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 py-3 bg-surface-container-low rounded-xl" role="img" aria-label={`Tooth ${toothNumber}: ${typeLabel}`}>
      {/* Tooth illustration */}
      <div className="relative w-full max-w-xs sm:max-w-[120px] aspect-[5/6] sm:aspect-auto sm:h-[96px] flex-shrink-0">
        <svg viewBox="0 0 64 72" className="w-full h-full" aria-hidden="true">
          <SelectedToothShape type={type} isUpper={isUpper} />
        </svg>
        {/* Tooth number badge */}
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-ink/80 text-on-background text-xs font-mono font-bold flex items-center justify-center">
          {toothNumber}
        </div>
        {/* Type color accent */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-1.5 rounded-t"
          style={{ backgroundColor: `var(--color-${typeColor.replace('text-', '').replace('dark:text-', '')})` }}
          aria-hidden="true"
        />
      </div>

      {/* Tooth info */}
      <div className="text-center sm:text-left">
        <p className="font-heading text-lg font-semibold text-ink">Tooth {toothNumber}</p>
        <p className="mt-1 font-mono text-sm text-slate">
          {typeLabel} • {isUpper ? 'Upper' : 'Lower'} arch
        </p>
        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${typeColor}`}>
          {typeLabel}
        </span>
      </div>
    </div>
  );
}

/** SVG shape for single selected tooth */
function SelectedToothShape({
  type,
  isUpper,
}: {
  type: 'molar' | 'premolar' | 'canine' | 'incisor';
  isUpper: boolean;
}) {
  const strokeColor = 'currentColor';
  const strokeWidth = 2;
  const fillColor = 'transparent';

  switch (type) {
    case 'molar': {
      if (isUpper) {
        // Upper molar: 4 cusps, rhomboid, 3 roots
        return (
          <g>
            <path
              d="M12 8 L28 4 L52 16 L36 32 L12 28 Z
                 M20 14 L24 10 L36 18 L32 22 Z
                 M32 18 L36 10 L48 18 L44 26 Z"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            <path d="M18 32 L16 58" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" />
            <path d="M32 32 L32 58" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" />
            <path d="M46 32 L48 58" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" />
            <path d="M20 14 L32 30" stroke={strokeColor} strokeWidth={1} strokeDasharray="3 3" opacity="0.5" />
            <path d="M44 18 L32 30" stroke={strokeColor} strokeWidth={1} strokeDasharray="3 3" opacity="0.5" />
          </g>
        );
      }
      // Lower molar: 5 cusps, rectangular, 2 roots
      return (
        <g>
          <path
            d="M10 8 L54 8 L54 32 L10 32 Z
               M18 14 L22 8 L30 16 L26 20 Z
               M34 8 L42 14 L38 20 L30 16 Z
               M46 14 L50 8 L54 16 L50 20 Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          <path d="M20 32 L18 58" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" />
          <path d="M44 32 L46 58" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" />
          <path d="M32 8 L32 30" stroke={strokeColor} strokeWidth={1} strokeDasharray="3 3" opacity="0.5" />
          <path d="M18 14 L32 30" stroke={strokeColor} strokeWidth={1} strokeDasharray="3 3" opacity="0.5" />
          <path d="M46 14 L32 30" stroke={strokeColor} strokeWidth={1} strokeDasharray="3 3" opacity="0.5" />
        </g>
      );
    }

    case 'premolar': {
      if (isUpper) {
        // Upper premolar: 2 cusps, oval, 1 root
        return (
          <g>
            <path
              d="M16 8 L48 8 C50 8 52 12 52 18 L52 32 C52 40 50 44 46 46 L18 46 C14 44 12 40 12 32 L12 18 C12 12 14 8 16 8 Z
                 M28 12 L36 8 L42 20 L34 26 Z"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            <path d="M32 32 L32 58" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" />
            <path d="M32 12 L32 30" stroke={strokeColor} strokeWidth={1} strokeDasharray="3 3" opacity="0.5" />
          </g>
        );
      }
      // Lower premolar: 2-3 cusps, more circular, 1 root
      return (
        <g>
          <path
            d="M18 8 L46 8 C48 8 50 12 50 18 L50 32 C50 38 48 42 44 44 L20 44 C16 42 14 38 14 32 L14 18 C14 12 16 8 18 8 Z
               M26 10 L32 8 L38 10 L38 28 L26 28 Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          <path d="M32 32 L32 58" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" />
          <path d="M32 10 L32 28" stroke={strokeColor} strokeWidth={1} strokeDasharray="3 3" opacity="0.5" />
        </g>
      );
    }

    case 'canine': {
      // Single pointed cusp, long root
      return (
        <g>
          <path
            d="M20 8 L44 8 C48 8 50 12 50 18 L50 30 C50 36 48 40 44 42 L32 48 L20 42 C14 40 12 36 12 30 L12 18 C12 12 14 8 16 8 Z
               M28 10 L32 8 L36 10 L36 28 L28 28 Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          <path d="M32 32 L32 64" stroke={strokeColor} strokeWidth={2} strokeLinecap="round" />
          <path d="M32 10 L32 28" stroke={strokeColor} strokeWidth={1} strokeDasharray="3 3" opacity="0.5" />
        </g>
      );
    }

    case 'incisor': {
      // Chisel-shaped, flat incisal edge
      return (
        <g>
          <path
            d="M22 8 L42 8 L42 30 C42 36 38 40 32 42 C26 40 22 36 22 30 Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          <path d="M32 32 L32 62" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" />
          <path d="M22 8 L42 8" stroke={strokeColor} strokeWidth={2.5} strokeLinecap="round" />
          <path d="M28 8 L28 16" stroke={strokeColor} strokeWidth={1} strokeDasharray="2 2" opacity="0.3" />
          <path d="M32 8 L32 16" stroke={strokeColor} strokeWidth={1} strokeDasharray="2 2" opacity="0.3" />
          <path d="M36 8 L36 16" stroke={strokeColor} strokeWidth={1} strokeDasharray="2 2" opacity="0.3" />
        </g>
      );
    }

    default:
      return null;
  }
}