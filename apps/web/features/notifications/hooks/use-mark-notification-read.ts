'use client';
import { useApi } from '@/lib/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { notificationKeys } from './keys';

export function useMarkNotificationRead() {
  const api = useApi();
  const qc = useQueryClient();
  const session = useSession();
  const userId = session.data?.user?.id ?? '';
  return useMutation({
    mutationFn: (notificationId: string) => api.notifications.markRead(notificationId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.all(userId) });
    },
  });
}
