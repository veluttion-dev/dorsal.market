'use client';
import { useApi } from '@/lib/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionKeys } from './keys';

export function useTransferInProgress(id: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sellerId: string) => api.transactions.markTransferInProgress(id, sellerId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: transactionKeys.seller(id) });
      void qc.invalidateQueries({ queryKey: ['transactions', 'sales'] });
    },
  });
}
