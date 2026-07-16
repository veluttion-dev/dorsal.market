'use client';
import { useApi } from '@/lib/api-client';
import type { RunnerDataInput } from '@dorsal/schemas';
import { useMutation } from '@tanstack/react-query';

export function useReserveListing() {
  const api = useApi();
  return useMutation({
    mutationFn: (input: { dorsalId: string; runnerData?: RunnerDataInput }) =>
      api.transactions.reserveListing(input),
  });
}
