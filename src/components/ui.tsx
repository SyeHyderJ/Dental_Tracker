import { Loader2, X } from 'lucide-react';
import type { ReactNode } from 'react';

export function Spinner() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-porcelain">
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading" />
    </div>
  );
}

export function ErrorBanner({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-warning-soft px-4 py-3 text-sm text-allergy" role="alert">
      {children}
    </div>
  );
}

export function SuccessBanner({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-healthy-soft px-4 py-3 text-sm text-healthy" role="status">
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface-card px-5 py-10 text-center">
      <h2 className="font-heading text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-prose text-sm text-slate">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
    </div>
  );
}

export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4">
      <div
        className="max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl bg-card p-5 shadow-card sm:max-w-md sm:rounded-3xl"
        role="dialog"
        aria-labelledby="sheet-title"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="sheet-title" className="font-heading text-xl font-semibold">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-slate" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
