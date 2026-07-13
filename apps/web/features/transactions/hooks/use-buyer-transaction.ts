'use client';
import { useApi } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { transactionKeys } from './keys';

export function useBuyerTransaction(id: string | null | undefined) {
  const api = useApi();
  const session = useSession();
  const userId = session.data?.user?.id;
  return useQuery({
    queryKey: transactionKeys.buyer(userId ?? '', id ?? ''),
    queryFn: () => api.transactions.getBuyerTransaction(id as string),
    enabled: Boolean(userId && id),
    refetchInterval: 10_000,
  });
}
