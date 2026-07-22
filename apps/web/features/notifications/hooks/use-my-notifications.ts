'use client';
import { useApi } from '@/lib/api-client';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { notificationKeys } from './keys';

export function useMyNotifications(query?: { limit?: number; offset?: number }) {
  const api = useApi();
  const session = useSession();
  const userId = session.data?.user?.id;
  return useQuery({
    queryKey: notificationKeys.list(userId ?? '', query),
    queryFn: () => api.notifications.listMyNotifications(query),
    enabled: Boolean(userId),
    placeholderData: keepPreviousData,
  });
}
