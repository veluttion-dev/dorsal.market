'use client';
import { useApi } from '@/lib/api-client';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { transactionKeys } from './keys';

export function useMyPurchases(query?: { status?: string; limit?: number; offset?: number }) {
  const api = useApi();
  return useQuery({
    queryKey: transactionKeys.purchases(query),
    queryFn: () => api.transactions.listMyPurchases(query),
    placeholderData: keepPreviousData,
  });
}
