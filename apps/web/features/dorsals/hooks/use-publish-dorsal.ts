'use client';
import { useApi } from '@/lib/api-client';
import type { PublishDorsalInput } from '@dorsal/schemas';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function usePublishDorsal() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PublishDorsalInput) => api.dorsals.publish(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['dorsals'] });
    },
  });
}
