'use client';
import { useApi } from '@/lib/api-client';
import { useMutation } from '@tanstack/react-query';

export function useReserveListing() {
  const api = useApi();
  return useMutation({
    mutationFn: (input: { dorsalId: string; buyerId: string }) =>
      api.transactions.reserveListing(input),
  });
}
