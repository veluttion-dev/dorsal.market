'use client';
import { useApi } from '@/lib/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useTransferInProgress(id: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sellerId: string) => api.transactions.markTransferInProgress(id, sellerId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['transactions', 'buyer'] });
      void qc.invalidateQueries({ queryKey: ['transactions', 'seller'] });
      void qc.invalidateQueries({ queryKey: ['transactions', 'purchases'] });
      void qc.invalidateQueries({ queryKey: ['transactions', 'sales'] });
    },
  });
}
