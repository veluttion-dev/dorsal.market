'use client';
import { DorsalGrid } from '@/components/dorsal/dorsal-grid';
import { useDorsalsList } from '@/features/dorsals/hooks/use-dorsals-list';
import { FILTER_PARSERS } from '@/features/dorsals/lib/filter-parsers.client';
import { filtersFromQueryState } from '@/features/dorsals/lib/filters-url';
import { useTranslations } from 'next-intl';
import type { DorsalListResponse, SearchDorsalsQuery } from '@dorsal/schemas';
import { useQueryStates } from 'nuqs';
import { Pagination } from './pagination';

export function DorsalsListClient({ initialData }: { initialData: DorsalListResponse }) {
  const t = useTranslations('dorsals');
  const [q] = useQueryStates(FILTER_PARSERS);

  const filters: SearchDorsalsQuery = filtersFromQueryState(q);

  const { data, isFetching } = useDorsalsList(filters, initialData);

  return (
    <div>
      {isFetching && <p className="text-sm text-text-muted">{t('updating')}</p>}
      <DorsalGrid items={data?.items ?? []} />
      {data && data.total_pages > 1 && (
        <Pagination page={data.page} totalPages={data.total_pages} />
      )}
    </div>
  );
}
