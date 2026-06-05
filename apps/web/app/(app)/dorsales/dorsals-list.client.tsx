'use client';
import { DorsalGrid } from '@/components/dorsal/dorsal-grid';
import { useDorsalsList } from '@/features/dorsals/hooks/use-dorsals-list';
import { filtersFromQueryState } from '@/features/dorsals/lib/filters-url';
import type {
  Distance,
  DorsalListResponse,
  PaymentMethod,
  SearchDorsalsQuery,
} from '@dorsal/schemas';
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from 'nuqs';
import { Pagination } from './pagination';

const distances: Distance[] = ['5k', '10k', '21k', '42k', 'other'];
const payments: PaymentMethod[] = ['bizum', 'paypal', 'card'];
const sortBy: NonNullable<SearchDorsalsQuery['sort_by']>[] = ['price', 'race_date', 'created_at'];
const sortOrder: NonNullable<SearchDorsalsQuery['sort_order']>[] = ['asc', 'desc'];

export function DorsalsListClient({ initialData }: { initialData: DorsalListResponse }) {
  const [q] = useQueryStates({
    race_name: parseAsString,
    location: parseAsString,
    distance: parseAsArrayOf(parseAsStringEnum(distances)),
    price_min: parseAsInteger,
    price_max: parseAsInteger,
    payment_method: parseAsStringEnum(payments),
    date_from: parseAsString,
    date_to: parseAsString,
    sort_by: parseAsStringEnum(sortBy),
    sort_order: parseAsStringEnum(sortOrder),
    page: parseAsInteger,
    page_size: parseAsInteger,
  });

  const filters: SearchDorsalsQuery = filtersFromQueryState(q);

  const { data, isFetching } = useDorsalsList(filters, initialData);

  return (
    <div>
      {isFetching && <p className="text-sm text-text-muted">Actualizando…</p>}
      <DorsalGrid items={data?.items ?? []} />
      {data && data.total_pages > 1 && (
        <Pagination page={data.page} totalPages={data.total_pages} />
      )}
    </div>
  );
}
