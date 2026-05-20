import {
  Distance,
  type PaymentMethod,
  SearchDorsalsQuery,
  type SearchDorsalsQuery as SearchDorsalsQueryType,
} from '@dorsal/schemas';

const SINGLE_KEYS = [
  'race_name',
  'price_min',
  'price_max',
  'payment_method',
  'location',
  'date_from',
  'date_to',
  'sort_by',
  'sort_order',
  'page',
  'page_size',
] as const;

type SortBy = NonNullable<SearchDorsalsQueryType['sort_by']>;
type SortOrder = NonNullable<SearchDorsalsQueryType['sort_order']>;

export interface DorsalQueryState {
  race_name?: string | null;
  location?: string | null;
  distance?: Distance[] | null;
  price_min?: number | null;
  price_max?: number | null;
  payment_method?: PaymentMethod | null;
  date_from?: string | null;
  date_to?: string | null;
  sort_by?: SortBy | null;
  sort_order?: SortOrder | null;
  page?: number | null;
  page_size?: number | null;
}

/** URL searchParams -> validated SearchDorsalsQuery (invalid values are dropped). */
export function parseFiltersFromSearchParams(sp: URLSearchParams): SearchDorsalsQueryType {
  const out: Record<string, unknown> = {};
  const shape = SearchDorsalsQuery.shape;

  for (const key of SINGLE_KEYS) {
    const value = sp.get(key);
    if (value === null) continue;
    const parsed = shape[key].safeParse(value);
    if (parsed.success) out[key] = parsed.data;
  }

  const distances = sp
    .getAll('distance')
    .map((distance) => Distance.safeParse(distance))
    .filter((distance): distance is { success: true; data: Distance } => distance.success)
    .map((distance) => distance.data);
  if (distances.length > 0) out.distance = distances;

  return out as SearchDorsalsQueryType;
}

export function filtersFromQueryState(q: DorsalQueryState): SearchDorsalsQueryType {
  return {
    race_name: q.race_name ?? undefined,
    location: q.location ?? undefined,
    distance: q.distance ?? undefined,
    price_min: q.price_min ?? undefined,
    price_max: q.price_max ?? undefined,
    payment_method: q.payment_method ?? undefined,
    date_from: q.date_from ?? undefined,
    date_to: q.date_to ?? undefined,
    sort_by: q.sort_by ?? undefined,
    sort_order: q.sort_order ?? undefined,
    page: q.page ?? undefined,
    page_size: q.page_size ?? undefined,
  };
}

/** SearchDorsalsQuery -> URL searchParams (arrays repeat the key). */
export function serializeFiltersToSearchParams(filters: SearchDorsalsQueryType): URLSearchParams {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v)) {
      for (const item of v) sp.append(k, String(item));
    } else {
      sp.append(k, String(v));
    }
  }
  return sp;
}
