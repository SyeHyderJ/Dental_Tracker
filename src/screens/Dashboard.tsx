import { useAuth } from '../lib/auth';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, FileText, FolderOpen, Pill, Smile, TriangleAlert } from 'lucide-react';
import AppShell from '../components/AppShell';
import { ErrorBanner, Spinner } from '../components/ui';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [allergyCount, setAllergyCount] = useState(0);
  const [medCount, setMedCount] = useState(0);
  const [recordCount, setRecordCount] = useState(0);
  const [docCount, setDocCount] = useState(0);
  const [nextVisit, setNextVisit] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profile, allergies, meds, teeth, docs, appts, connections] = await Promise.all([
          supabase.from('profiles').select('full_name').eq('id', user.id).single(),
          supabase.from('allergies').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('medications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('active', true),
          supabase.from('tooth_records').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('documents').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('appointments').select('appointment_date, provider_name').eq('user_id', user.id).order('appointment_date', { ascending: true }),
          supabase.rpc('get_my_provider_connections'),
        ]);

        setName(profile.data?.full_name || user.email?.split('@')[0] || '');
        setAllergyCount(allergies.count || 0);
        setMedCount(meds.count || 0);
        setRecordCount(teeth.count || 0);
        setDocCount(docs.count || 0);

        const now = new Date();
        const upcoming = (appts.data || []).find((a) => new Date(a.appointment_date) > now);
        if (upcoming) {
          const when = new Date(upcoming.appointment_date).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          });
          setNextVisit(`${when} with ${upcoming.provider_name}`);
        } else {
          setNextVisit(null);
        }

        const pending = (connections.data || []).filter((c: { status: string }) => c.status === 'pending');
        setPendingCount(pending.length);

        const firstError =
          allergies.error?.message ||
          meds.error?.message ||
          teeth.error?.message ||
          docs.error?.message ||
          appts.error?.message;
        if (firstError) setError(firstError);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  if (loading) return <Spinner />;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const tiles = [
    {
      label: 'Allergies',
      count: allergyCount,
      to: '/records/allergies',
      icon: TriangleAlert,
      wrap: 'bg-allergy-soft text-allergy',
    },
    {
      label: 'Medications',
      count: medCount,
      to: '/records/medications',
      icon: Pill,
      wrap: 'bg-medication-soft text-medication',
    },
    {
      label: 'Dental chart',
      count: recordCount,
      to: '/tooth-chart',
      icon: Smile,
      wrap: 'bg-chart-soft text-chart-cat',
    },
    {
      label: 'Documents',
      count: docCount,
      to: '/records/documents',
      icon: FileText,
      wrap: 'bg-document-soft text-document',
    },
  ];

  return (
    <AppShell title={`${greeting}${name ? `, ${name}` : ''}`} subtitle="Your health summary" active="home">
      <div className="space-y-5">
        {error ? <ErrorBanner>{error}</ErrorBanner> : null}

        <button
          type="button"
          onClick={() => navigate('/appointments')}
          className="surface-card flex w-full items-center gap-4 p-4 text-left"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <Calendar className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-heading text-lg font-semibold">Next visit</span>
            <span className="text-sm text-slate">{nextVisit || 'No upcoming appointment. Schedule one when you are ready.'}</span>
          </span>
        </button>

        {pendingCount > 0 ? (
          <button
            type="button"
            onClick={() => navigate('/share-access')}
            className="surface-card flex w-full items-center justify-between p-4 text-left"
          >
            <span>
              <span className="block font-semibold">Provider access request</span>
              <span className="text-sm text-slate">
                {pendingCount} pending {pendingCount === 1 ? 'request' : 'requests'} to review
              </span>
            </span>
            <span className="text-sm font-semibold text-primary">Review</span>
          </button>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <button
                key={tile.label}
                type="button"
                onClick={() => navigate(tile.to)}
                className="surface-card flex min-h-[140px] flex-col items-start justify-between p-4 text-left"
              >
                <span className={`rounded-2xl p-2 ${tile.wrap}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-mono text-3xl font-medium tracking-tight">{tile.count}</span>
                  <span className="text-sm text-slate">{tile.label}</span>
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => navigate('/records')}
          className="btn-secondary w-full"
        >
          <FolderOpen className="h-4 w-4" />
          Open full record
        </button>
      </div>
    </AppShell>
  );
}
