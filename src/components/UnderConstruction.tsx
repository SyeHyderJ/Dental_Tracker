import { Construction, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppShell, { type PatientTab } from './AppShell';

export default function UnderConstruction({
  feature,
  active = 'records',
}: {
  feature: string;
  active?: PatientTab;
}) {
  const navigate = useNavigate();

  return (
    <AppShell
      title={feature}
      subtitle="This area is still being built."
      active={active}
    >
      <div className="flex flex-col items-center text-center py-16 px-4">
        <div className="w-16 h-16 bg-primary-soft rounded-full flex items-center justify-center text-primary mb-6">
          <Construction className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-ink">
          {feature} is coming soon
        </h2>
        <p className="text-sm text-slate mt-3 max-w-sm leading-relaxed">
          We&apos;re still working on this part of DentalTracker. Check back
          soon — your data stays safe and unchanged in the meantime.
        </p>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="btn-primary mt-8 max-w-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
      </div>
    </AppShell>
  );
}