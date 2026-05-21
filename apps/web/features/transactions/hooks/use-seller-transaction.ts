'use client';
import { useApi } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { transactionKeys } from './keys';

export function useSellerTransaction(id: string | null | undefined) {
  const api = useApi();
  return useQuery({
    queryKey: transactionKeys.seller(id ?? ''),
    queryFn: () => api.transactions.getSellerTransaction(id as string),
    enabled: Boolean(id),
    refetchInterval: 10_000,
  });
}
