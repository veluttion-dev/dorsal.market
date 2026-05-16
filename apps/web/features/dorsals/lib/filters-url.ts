import { SearchDorsalsQuery } from '@dorsal/schemas';

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

/** URL searchParams → validated SearchDorsalsQuery (invalid values are dropped). */
export function parseFiltersFromSearchParams(sp: URLSearchParams): SearchDorsalsQuery {
  const raw: Record<string, unknown> = {};
  for (const k of SINGLE_KEYS) {
    const v = sp.get(k);
    if (v !== null) raw[k] = v;
  }
  const distances = sp.getAll('distance');
  if (distances.length > 0) raw.distance = distances;

  const parsed = SearchDorsalsQuery.safeParse(raw);
  return parsed.success ? parsed.data : {};
}

/** SearchDorsalsQuery → URL searchParams (arrays repeat the key). */
export function serializeFiltersToSearchParams(filters: SearchDorsalsQuery): URLSearchParams {
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
