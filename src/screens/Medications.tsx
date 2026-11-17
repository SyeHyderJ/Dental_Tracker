import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { Spinner, ErrorBanner, EmptyState, Field, Sheet, Select } from '../components/ui';
import { Plus, Edit, Trash2, Pill } from 'lucide-react';
import { COMMON_MEDICATIONS } from '../lib/constants';
import type { Medication } from '../types/health';

export default function Medications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    customName: '',
    dose: '',
    schedule: '',
    reason: '',
    active: true,
  });

  // Fetch medications
  useEffect(() => {
    if (user) {
      fetchMedications();
    }
  }, [user]);

  const fetchMedications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMedications(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSheetOpen = (medication?: Medication) => {
    if (medication) {
      setEditingMedication(medication);
      setFormData({
        name: COMMON_MEDICATIONS.includes(medication.name as any) ? medication.name : 'Other...',
        customName: COMMON_MEDICATIONS.includes(medication.name as any) ? '' : medication.name,
        dose: medication.dose || '',
        schedule: medication.schedule || '',
        reason: medication.reason || '',
        active: medication.active,
      });
    } else {
      setEditingMedication(null);
      setFormData({
        name: '',
        customName: '',
        dose: '',
        schedule: '',
        reason: '',
        active: true,
      });
    }
  };

  const handleSheetClose = () => {
    setEditingMedication(null);
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value,
      customName: value === 'Other...' ? prev.customName : '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const name = formData.name === 'Other...' ? formData.customName : formData.name;
    if (!name.trim()) return;

    try {
      const payload = {
        user_id: user.id,
        name: name.trim(),
        dose: formData.dose.trim() || null,
        schedule: formData.schedule.trim() || null,
        reason: formData.reason.trim() || null,
        active: formData.active,
      };

      if (editingMedication) {
        const { error } = await supabase
          .from('medications')
          .update(payload)
          .eq('id', editingMedication.id)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('medications').insert(payload);
        if (error) throw error;
      }

      handleSheetClose();
      fetchMedications();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      setDeletingId(id);
      const { error } = await supabase
        .from('medications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
      fetchMedications();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (medication: Medication) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('medications')
        .update({ active: !medication.active })
        .eq('id', medication.id)
        .eq('user_id', user.id);
      if (error) throw error;
      fetchMedications();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <Spinner />;

  if (error) return <ErrorBanner>{error}</ErrorBanner>;

  if (!user) {
    navigate('/', { replace: true });
    return null;
  }

  const medicationOptions = COMMON_MEDICATIONS.map(m => ({
    value: m,
    label: m,
  }));

  return (
    <AppShell title="Medications" subtitle="Track your current and past medications" active="records">
      <div className="space-y-6">
        {/* Header with Add button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-xl font-semibold">Your Medications</h2>
            <p className="text-sm text-slate mt-0.5">
              {medications.length} {medications.length === 1 ? 'medication' : 'medications'} recorded
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleSheetOpen()}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" /> Add Medication
          </button>
        </div>

        {/* Medications List */}
        {medications.length === 0 ? (
          <EmptyState
            title="No medications recorded"
            body="Add your first medication to keep track of prescriptions and share with your care team."
            action={
              <button type="button" onClick={() => handleSheetOpen()} className="btn-primary">
                <Plus className="h-4 w-4" /> Add Medication
              </button>
            }
          />
        ) : (
          <div className="card-grid">
            {medications.map(medication => (
              <div key={medication.id} className="surface-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Pill className="h-4 w-4 text-medication" />
                      <h3 className="font-heading text-base font-semibold truncate">
                        {medication.name}
                        {!medication.active && (
                          <span className="ml-2 text-xs text-slate">(Inactive)</span>
                        )}
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate">
                      {medication.dose && (
                        <span className="flex items-center gap-1">
                          <span className="font-mono">{medication.dose}</span>
                        </span>
                      )}
                      {medication.schedule && (
                        <span className="flex items-center gap-1">
                          {medication.schedule}
                        </span>
                      )}
                      {medication.reason && (
                        <span className="flex-1 truncate">
                          For: {medication.reason}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(medication)}
                      className={`rounded-lg p-2 transition-colors touch-target-min ${
                        medication.active
                          ? 'bg-healthy-soft text-healthy'
                          : 'bg-surface-container-low text-slate'
                      }`}
                      aria-label={medication.active ? 'Mark as inactive' : 'Mark as active'}
                    >
                      <Pill className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSheetOpen(medication)}
                      className="rounded-lg p-2 text-slate hover:bg-surface-container-low transition-colors touch-target-min"
                      aria-label={`Edit ${medication.name}`}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(medication.id)}
                      disabled={deletingId === medication.id}
                      className="rounded-lg p-2 text-slate hover:bg-surface-container-low transition-colors touch-target-min"
                      aria-label={`Delete ${medication.name}`}
                    >
                      {deletingId === medication.id ? (
                        <span className="animate-spin h-4 w-4" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-allergy" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Sheet */}
        <Sheet
          title={editingMedication ? 'Edit Medication' : 'Add Medication'}
          onClose={handleSheetClose}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field id="name" label="Medication">
              <Select
                id="name"
                label=""
                value={formData.name}
                onChange={handleNameChange}
                options={medicationOptions}
                placeholder="Select a medication"
                required
              />
            </Field>

            {formData.name === 'Other...' && (
              <Field id="customName" label="Custom Medication">
                <input
                  type="text"
                  id="customName"
                  value={formData.customName}
                  onChange={e => setFormData(prev => ({ ...prev, customName: e.target.value }))}
                  className="field-input"
                  placeholder="Enter medication name"
                  required
                  autoComplete="off"
                />
              </Field>
            )}

            <div className="form-grid form-grid-2">
              <Field id="dose" label="Dose (optional)">
                <input
                  type="text"
                  id="dose"
                  value={formData.dose}
                  onChange={e => setFormData(prev => ({ ...prev, dose: e.target.value }))}
                  className="field-input"
                  placeholder="e.g., 500mg, 10ml"
                />
              </Field>

              <Field id="schedule" label="Schedule (optional)">
                <input
                  type="text"
                  id="schedule"
                  value={formData.schedule}
                  onChange={e => setFormData(prev => ({ ...prev, schedule: e.target.value }))}
                  className="field-input"
                  placeholder="e.g., Twice daily, Every 6 hours"
                />
              </Field>
            </div>

            <Field id="reason" label="Reason (optional)">
              <input
                type="text"
                id="reason"
                value={formData.reason}
                onChange={e => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                className="field-input"
                placeholder="e.g., Infection, Pain management"
              />
            </Field>

            <Field id="active" label="Status">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={e => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-ring"
                />
                <span className="font-medium text-ink">Currently taking</span>
              </label>
            </Field>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleSheetClose}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
              >
                {editingMedication ? 'Save Changes' : 'Add Medication'}
              </button>
            </div>
          </form>
        </Sheet>
      </div>
    </AppShell>
  );
}