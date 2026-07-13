'use client';
import { useApi } from '@/lib/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useConfirmTransfer(id: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (buyerId: string) => api.transactions.confirmTransfer(id, buyerId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['transactions', 'buyer'] });
      void qc.invalidateQueries({ queryKey: ['transactions', 'seller'] });
      void qc.invalidateQueries({ queryKey: ['transactions', 'purchases'] });
      void qc.invalidateQueries({ queryKey: ['transactions', 'sales'] });
    },
  });
}
