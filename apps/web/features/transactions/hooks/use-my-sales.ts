'use client';
import { useApi } from '@/lib/api-client';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { transactionKeys } from './keys';

export function useMySales(query?: { status?: string; limit?: number; offset?: number }) {
  const api = useApi();
  const session = useSession();
  const userId = session.data?.user?.id;
  return useQuery({
    queryKey: transactionKeys.sales(userId ?? '', query),
    queryFn: () => api.transactions.listMySales(query),
    enabled: Boolean(userId),
    placeholderData: keepPreviousData,
  });
}
