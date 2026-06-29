import { DorsalFiltersMobile } from '@/components/dorsal/dorsal-filters-mobile.client';
import { DorsalFilters } from '@/components/dorsal/dorsal-filters.client';
import { DorsalsListClient } from '@/features/dorsals/components/dorsals-list.client';
import { parseFiltersFromSearchParams } from '@/features/dorsals/lib/filters-url';
import { searchDorsals } from '@/features/dorsals/server/search';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

type SearchParams = { [k: string]: string | string[] | undefined };

export const metadata: Metadata = {
  title: 'dorsal.market — Compra y vende dorsales de carreras',
  description:
    'Marketplace de dorsales de carreras populares en España con pago en custodia. Encuentra tu dorsal o vende el tuyo de forma segura.',
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const t = await getTranslations('home');
  const sp = await searchParams;
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (Array.isArray(v)) {
      for (const x of v) usp.append(k, x);
    } else if (v !== undefined) {
      usp.append(k, v);
    }
  }
  const filters = parseFiltersFromSearchParams(usp);
  const initial = await searchDorsals(filters);

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold">
          {t('heading')} <em className="not-italic text-coral">{t('heading_highlight')}</em>
        </h1>
        <p className="mt-2 text-sm text-text-muted">{t('found', { total: initial.total })}</p>
      </header>
      <div className="mb-4 lg:hidden">
        <DorsalFiltersMobile />
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <div className="hidden lg:block">
          <DorsalFilters />
        </div>
        <DorsalsListClient initialData={initial} />
      </div>
    </main>
  );
}
