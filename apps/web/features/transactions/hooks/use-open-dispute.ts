'use client';
import { useApi } from '@/lib/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useOpenDispute(id: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { reason: string }) => api.transactions.openDispute(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['transactions', 'buyer'] });
    },
  });
}
