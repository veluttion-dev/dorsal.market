'use client';
import { useApi } from '@/lib/api-client';
import { useMutation } from '@tanstack/react-query';

export function useOnboardSeller() {
  const api = useApi();
  return useMutation({
    mutationFn: () => api.transactions.onboardSeller(),
  });
}
