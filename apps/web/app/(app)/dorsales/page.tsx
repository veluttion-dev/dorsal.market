import type { Metadata } from 'next';
import { DorsalFilters } from '@/components/dorsal/dorsal-filters.client';
import { parseFiltersFromSearchParams } from '@/features/dorsals/lib/filters-url';
import { searchDorsals } from '@/features/dorsals/server/search';
import { DorsalsListClient } from './dorsals-list.client';

type SearchParams = { [k: string]: string | string[] | undefined };

export const metadata: Metadata = {
  title: 'Explorar dorsales',
  description:
    'Encuentra dorsales en venta de las principales carreras populares en España.',
};

export default async function DorsalesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
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
          Encuentra tu <em className="not-italic text-coral">dorsal</em>
        </h1>
        <p className="mt-2 text-sm text-text-muted">{initial.total} dorsales encontrados</p>
      </header>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <DorsalFilters />
        <DorsalsListClient initialData={initial} />
      </div>
    </main>
  );
}
