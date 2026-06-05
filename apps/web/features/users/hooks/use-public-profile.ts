'use client';
import { useApi } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';

export function usePublicProfile(userId: string | null | undefined) {
  const api = useApi();

  return useQuery({
    queryKey: ['users', 'public', userId],
    queryFn: () => api.users.getPublicProfile(userId as string),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
}
