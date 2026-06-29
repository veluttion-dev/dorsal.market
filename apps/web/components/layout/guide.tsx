import { Button } from '@/components/ui/button';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export interface GuideStep {
  title: string;
  body: string;
}

export async function Guide({
  eyebrow,
  title,
  intro,
  steps,
  cta,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  steps: GuideStep[];
  cta: { href: string; label: string };
}) {
  const t = await getTranslations('guide');

  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-wider text-coral">{eyebrow}</p>
      <h1 className="mt-2 text-4xl font-bold">{title}</h1>
      <p className="mt-3 text-lg text-text-secondary">{intro}</p>

      <ol className="mt-10 space-y-4">
        {steps.map((step, i) => (
          <li
            key={step.title}
            className="flex gap-4 rounded-lg border border-border bg-bg-card p-5"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-coral-subtle font-mono text-sm font-bold text-coral">
              {i + 1}
            </span>
            <div>
              <h2 className="font-semibold leading-tight">{step.title}</h2>
              <p className="mt-1 text-sm text-text-secondary">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-10 flex flex-col items-start gap-4 rounded-lg border-2 border-coral bg-coral-subtle/40 p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold">{t('ready')}</p>
        <Link href={cta.href}>
          <Button size="lg">{cta.label}</Button>
        </Link>
      </div>
    </main>
  );
}
