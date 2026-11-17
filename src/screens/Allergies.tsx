import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { Spinner, ErrorBanner, EmptyState, Field, Sheet, Select } from '../components/ui';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { COMMON_ALLERGIES, ALLERGY_SEVERITIES, type AllergySeverity } from '../lib/constants';
import type { Allergy } from '../types/health';

export default function Allergies() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingAllergy, setEditingAllergy] = useState<Allergy | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    allergen: '',
    customAllergen: '',
    reaction: '',
    severity: 'mild' as AllergySeverity,
    notes: '',
  });

  // Fetch allergies
  useEffect(() => {
    if (user) {
      fetchAllergies();
    }
  }, [user]);

  const fetchAllergies = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('allergies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllergies(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSheetOpen = (allergy?: Allergy) => {
    if (allergy) {
      setEditingAllergy(allergy);
      setFormData({
        allergen: COMMON_ALLERGIES.includes(allergy.allergen as any) ? allergy.allergen : 'Other...',
        customAllergen: COMMON_ALLERGIES.includes(allergy.allergen as any) ? '' : allergy.allergen,
        reaction: allergy.reaction || '',
        severity: allergy.severity,
        notes: allergy.notes || '',
      });
    } else {
      setEditingAllergy(null);
      setFormData({
        allergen: '',
        customAllergen: '',
        reaction: '',
        severity: 'mild',
        notes: '',
      });
    }
  };

  const handleSheetClose = () => {
    setEditingAllergy(null);
  };

  const handleAllergenChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      allergen: value,
      customAllergen: value === 'Other...' ? prev.customAllergen : '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const allergen = formData.allergen === 'Other...' ? formData.customAllergen : formData.allergen;
    if (!allergen.trim()) return;

    try {
      const payload = {
        user_id: user.id,
        allergen: allergen.trim(),
        reaction: formData.reaction.trim() || null,
        severity: formData.severity,
        notes: formData.notes.trim() || null,
      };

      if (editingAllergy) {
        const { error } = await supabase
          .from('allergies')
          .update(payload)
          .eq('id', editingAllergy.id)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('allergies').insert(payload);
        if (error) throw error;
      }

      handleSheetClose();
      fetchAllergies();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      setDeletingId(id);
      const { error } = await supabase
        .from('allergies')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
      fetchAllergies();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const getSeverityColor = (severity: AllergySeverity) => {
    switch (severity) {
      case 'mild': return 'bg-healthy-soft text-healthy';
      case 'moderate': return 'bg-medication-soft text-medication';
      case 'severe': return 'bg-allergy-soft text-allergy';
    }
  };

  if (loading) return <Spinner />;

  if (error) return <ErrorBanner>{error}</ErrorBanner>;

  if (!user) {
    navigate('/', { replace: true });
    return null;
  }

  const allergenOptions = COMMON_ALLERGIES.map(a => ({
    value: a,
    label: a,
  }));

  return (
    <AppShell title="Allergies" subtitle="Track your allergies and adverse reactions" active="records">
      <div className="space-y-6">
        {/* Header with Add button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-xl font-semibold">Your Allergies</h2>
            <p className="text-sm text-slate mt-0.5">
              {allergies.length} {allergies.length === 1 ? 'allergy' : 'allergies'} recorded
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleSheetOpen()}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" /> Add Allergy
          </button>
        </div>

        {/* Allergies List */}
        {allergies.length === 0 ? (
          <EmptyState
            title="No allergies recorded"
            body="Add your first allergy to keep track of adverse reactions and share with your care team."
            action={
              <button type="button" onClick={() => handleSheetOpen()} className="btn-primary">
                <Plus className="h-4 w-4" /> Add Allergy
              </button>
            }
          />
        ) : (
          <div className="card-grid">
            {allergies.map(allergy => (
              <div key={allergy.id} className="surface-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading text-base font-semibold truncate">{allergy.allergen}</h3>
                    {allergy.reaction && (
                      <p className="text-sm text-slate mt-1 line-clamp-1">
                        Reaction: {allergy.reaction}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getSeverityColor(allergy.severity)}`}>
                        {allergy.severity}
                      </span>
                      {allergy.notes && (
                        <span className="text-xs text-slate flex-1 truncate">
                          {allergy.notes}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSheetOpen(allergy)}
                      className="rounded-lg p-2 text-slate hover:bg-surface-container-low transition-colors touch-target-min"
                      aria-label={`Edit ${allergy.allergen}`}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(allergy.id)}
                      disabled={deletingId === allergy.id}
                      className="rounded-lg p-2 text-slate hover:bg-surface-container-low transition-colors touch-target-min"
                      aria-label={`Delete ${allergy.allergen}`}
                    >
                      {deletingId === allergy.id ? (
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
          title={editingAllergy ? 'Edit Allergy' : 'Add Allergy'}
          onClose={handleSheetClose}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field id="allergen" label="Allergen">
              <Select
                id="allergen"
                label=""
                value={formData.allergen}
                onChange={handleAllergenChange}
                options={allergenOptions}
                placeholder="Select an allergen"
                required
              />
            </Field>

            {formData.allergen === 'Other...' && (
              <Field id="customAllergen" label="Custom Allergen">
                <input
                  type="text"
                  id="customAllergen"
                  value={formData.customAllergen}
                  onChange={e => setFormData(prev => ({ ...prev, customAllergen: e.target.value }))}
                  className="field-input"
                  placeholder="Enter allergen name"
                  required
                  autoComplete="off"
                />
              </Field>
            )}

            <Field id="reaction" label="Reaction (optional)">
              <input
                type="text"
                id="reaction"
                value={formData.reaction}
                onChange={e => setFormData(prev => ({ ...prev, reaction: e.target.value }))}
                className="field-input"
                placeholder="e.g., Hives, swelling, difficulty breathing"
              />
            </Field>

            <Field id="severity" label="Severity">
              <Select
                id="severity"
                label=""
                value={formData.severity}
                onChange={value => setFormData(prev => ({ ...prev, severity: value as AllergySeverity }))}
                options={ALLERGY_SEVERITIES.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
                required
              />
            </Field>

            <Field id="notes" label="Notes (optional)">
              <textarea
                id="notes"
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="field-input min-h-[80px] resize-y"
                placeholder="Additional details..."
                rows={3}
              />
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
                {editingAllergy ? 'Save Changes' : 'Add Allergy'}
              </button>
            </div>
          </form>
        </Sheet>
      </div>
    </AppShell>
  );
}