'use client';
import type { Distance, DorsalListResponse, PaymentMethod, SearchDorsalsQuery } from '@dorsal/schemas';
import { parseAsArrayOf, parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';
import { DorsalGrid } from '@/components/dorsal/dorsal-grid';
import { useDorsalsList } from '@/features/dorsals/hooks/use-dorsals-list';
import { Pagination } from './pagination';

const distances: Distance[] = ['5k', '10k', '21k', '42k', 'trail', 'ultra'];
const payments: PaymentMethod[] = ['bizum', 'paypal', 'card'];

export function DorsalsListClient({ initialData }: { initialData: DorsalListResponse }) {
  const [q] = useQueryStates({
    race_name: parseAsString,
    location: parseAsString,
    distance: parseAsArrayOf(parseAsStringEnum(distances)),
    price_min: parseAsInteger,
    price_max: parseAsInteger,
    payment_method: parseAsStringEnum(payments),
    page: parseAsInteger,
  });

  const filters: SearchDorsalsQuery = {
    race_name: q.race_name ?? undefined,
    location: q.location ?? undefined,
    distance: (q.distance as Distance[] | null) ?? undefined,
    price_min: q.price_min ?? undefined,
    price_max: q.price_max ?? undefined,
    payment_method: (q.payment_method as PaymentMethod | null) ?? undefined,
    page: q.page ?? undefined,
  };

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
