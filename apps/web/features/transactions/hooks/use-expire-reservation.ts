'use client';
import { useApi } from '@/lib/api-client';
import { useMutation } from '@tanstack/react-query';

export function useExpireReservation() {
  const api = useApi();
  return useMutation({
    mutationFn: (transactionId: string) => api.transactions.expireReservation(transactionId),
  });
}
