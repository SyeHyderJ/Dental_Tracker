import { Smile } from 'lucide-react';
import type { ReactNode } from 'react';

export default function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-porcelain px-4 py-10 text-ink">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-on-primary">
            <Smile className="h-5 w-5" />
          </div>
          <p className="font-heading text-sm font-semibold text-primary">DentalTracker</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 max-w-prose text-slate">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
