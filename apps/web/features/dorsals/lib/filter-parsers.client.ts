'use client';
import { Distance, SearchDorsalsQuery } from '@dorsal/schemas';
import { parseAsArrayOf, parseAsInteger, parseAsString, parseAsStringEnum } from 'nuqs';

// Shared nuqs parser config for the filter URL state (one source of truth).
// Client-only: nuqs `parseAs*` can't run during server render, so this lives
// apart from filters-url.ts (which the server page imports).
export const FILTER_PARSERS = {
  race_name: parseAsString,
  location: parseAsString,
  distance: parseAsArrayOf(parseAsStringEnum([...Distance.options])),
  price_min: parseAsInteger,
  price_max: parseAsInteger,
  date_from: parseAsString,
  date_to: parseAsString,
  sort_by: parseAsStringEnum([...SearchDorsalsQuery.shape.sort_by.unwrap().options]),
  sort_order: parseAsStringEnum([...SearchDorsalsQuery.shape.sort_order.unwrap().options]),
  page: parseAsInteger,
  page_size: parseAsInteger,
};
