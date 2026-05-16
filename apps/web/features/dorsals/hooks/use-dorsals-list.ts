'use client';
import type { DorsalListResponse, SearchDorsalsQuery } from '@dorsal/schemas';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/lib/api-client';

export function useDorsalsList(query: SearchDorsalsQuery, initialData?: DorsalListResponse) {
  const api = useApi();
  return useQuery({
    queryKey: ['dorsals', 'list', query],
    queryFn: () => api.dorsals.search(query),
    initialData,
    staleTime: 30 * 1000,
  });
}
