import type { ReactNode } from 'react';

export function FormSection({
  icon,
  title,
  children,
  badge,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  badge?: string;
}) {
  return (
    <section className="space-y-5 rounded-lg border border-border bg-bg-card p-6">
      <header className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-coral-subtle text-coral">
          {icon}
        </span>
        <h2 className="text-base font-semibold">{title}</h2>
        {badge && (
          <span className="ml-auto rounded-full bg-bg-elevated px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide text-text-muted">
            {badge}
          </span>
        )}
      </header>
      {children}
    </section>
  );
}
