'use client';
import { useApi } from '@/lib/api-client';
import type { RunnerDataInput } from '@dorsal/schemas';
import { useMutation } from '@tanstack/react-query';

export function useUpdateCheckoutRunnerData() {
  const api = useApi();
  return useMutation({
    mutationFn: (input: { transactionId: string; runnerData: RunnerDataInput }) =>
      api.transactions.updateCheckoutRunnerData(input.transactionId, input.runnerData),
  });
}
