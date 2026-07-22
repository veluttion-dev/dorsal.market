'use client';
import { useApi } from '@/lib/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useSubmitProof(id: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => api.transactions.uploadProofMultipart(id, file),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['transactions', 'buyer'] });
      void qc.invalidateQueries({ queryKey: ['transactions', 'seller'] });
      void qc.invalidateQueries({ queryKey: ['transactions', 'purchases'] });
      void qc.invalidateQueries({ queryKey: ['transactions', 'sales'] });
    },
  });
}
