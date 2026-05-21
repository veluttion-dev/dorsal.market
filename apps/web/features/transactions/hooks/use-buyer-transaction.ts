'use client';
import { useApi } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { transactionKeys } from './keys';

export function useBuyerTransaction(id: string | null | undefined) {
  const api = useApi();
  return useQuery({
    queryKey: transactionKeys.buyer(id ?? ''),
    queryFn: () => api.transactions.getBuyerTransaction(id as string),
    enabled: Boolean(id),
    refetchInterval: 10_000,
  });
}
