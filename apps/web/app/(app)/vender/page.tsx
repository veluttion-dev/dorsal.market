import { PublishWizard } from '@/features/dorsals/components/publish-wizard.client';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Vender dorsal' };

export default async function VenderPage() {
  const t = await getTranslations('sell');
  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">
          {t('heading')} <em className="not-italic text-coral">{t('heading_highlight')}</em>
        </h1>
        <p className="mt-1 text-text-secondary">{t('subtitle')}</p>
        <p className="mt-2 text-sm text-text-secondary">{t('configure_hint')}</p>
        <Link
          href="/vender/onboarding"
          className="mt-4 inline-flex rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-bg-elevated"
        >
          {t('configure_link')}
        </Link>
      </header>
      <PublishWizard />
    </main>
  );
}
