'use client';
import { useApi } from '@/lib/api-client';
import type { DorsalListResponse, SearchDorsalsQuery } from '@dorsal/schemas';
import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';

export function useDorsalsList(query: SearchDorsalsQuery, initialData?: DorsalListResponse) {
  const api = useApi();
  // initialData seeds *every* new queryKey and (with staleTime) marks it fresh,
  // which suppressed refetches when filters changed. Only seed the first query
  // (the one the server rendered); other filter combos must fetch.
  const firstQuery = useRef(JSON.stringify(query));
  const isFirstQuery = JSON.stringify(query) === firstQuery.current;

  return useQuery({
    queryKey: ['dorsals', 'list', query],
    queryFn: () => api.dorsals.search(query),
    initialData: isFirstQuery ? initialData : undefined,
    staleTime: 30 * 1000,
  });
}
