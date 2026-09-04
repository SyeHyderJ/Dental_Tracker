import { Calendar, FolderOpen, Home, Settings, Smile } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';

export type PatientTab = 'home' | 'chart' | 'records' | 'care' | 'you';

const tabs: { id: PatientTab; label: string; to: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', to: '/dashboard', icon: Home },
  { id: 'chart', label: 'Chart', to: '/tooth-chart', icon: Smile },
  { id: 'records', label: 'Records', to: '/records', icon: FolderOpen },
  { id: 'care', label: 'Care', to: '/appointments', icon: Calendar },
  { id: 'you', label: 'You', to: '/settings', icon: Settings },
];

export default function AppShell({
  title,
  subtitle,
  active,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  active: PatientTab;
  children: ReactNode;
  action?: ReactNode;
}) {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-porcelain text-ink font-sans">
      <header className="sticky top-0 z-20 border-b border-border bg-porcelain/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-start justify-between gap-3">
          <div>
            <h1 className="font-heading text-xl font-semibold tracking-tight">{title}</h1>
            {subtitle ? <p className="mt-0.5 text-sm text-slate">{subtitle}</p> : null}
          </div>
          {action}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-28 pt-5">{children}</main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-sm"
        aria-label="Patient navigation"
      >
        <div className="mx-auto flex max-w-3xl items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = tab.id === active;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => navigate(tab.to)}
                className="flex min-w-[3.5rem] flex-col items-center gap-1 px-2 py-1 text-[11px] font-semibold"
                aria-current={selected ? 'page' : undefined}
              >
                <span
                  className={`rounded-full p-2 ${
                    selected ? 'bg-primary text-on-primary' : 'text-slate'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className={selected ? 'text-ink' : 'text-slate'}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
