'use client';
import { useApi } from '@/lib/api-client';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { transactionKeys } from './keys';

export function useMySales(query?: { status?: string; limit?: number; offset?: number }) {
  const api = useApi();
  return useQuery({
    queryKey: transactionKeys.sales(query),
    queryFn: () => api.transactions.listMySales(query),
    placeholderData: keepPreviousData,
  });
}
