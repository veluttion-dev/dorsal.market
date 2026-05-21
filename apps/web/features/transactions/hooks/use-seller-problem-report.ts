'use client';
import { useApi } from '@/lib/api-client';
import type { SellerProblemCategory } from '@dorsal/schemas';
import { useMutation } from '@tanstack/react-query';

export function useSellerProblemReport(id: string) {
  const api = useApi();
  return useMutation({
    mutationFn: (input: { category: SellerProblemCategory; message: string; files?: File[] }) =>
      api.transactions.createSellerProblemReport({ transactionId: id, ...input }),
  });
}
