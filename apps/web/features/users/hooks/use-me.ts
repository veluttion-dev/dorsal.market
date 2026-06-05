'use client';
import { useApi } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

export function useMe() {
  const api = useApi();
  const { data } = useSession();

  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => api.users.getMe(),
    enabled: Boolean(data?.user?.id),
    staleTime: 60_000,
  });
}
