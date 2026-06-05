'use client';
import { useApi } from '@/lib/api-client';
import type { PatchUserProfileInput } from '@dorsal/schemas';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function usePatchProfile() {
  const api = useApi();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: PatchUserProfileInput) => api.users.patchMe(input),
    onSuccess: (user) => {
      qc.setQueryData(['users', 'me'], user);
    },
  });
}
