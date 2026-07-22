'use client';
import { Button } from '@/components/ui/button';
import { useMarkNotificationRead } from '@/features/notifications/hooks/use-mark-notification-read';
import { useMyNotifications } from '@/features/notifications/hooks/use-my-notifications';
import type { NotificationItem } from '@dorsal/schemas';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';

function NotificationRow({
  item,
  onMarkRead,
  marking,
}: {
  item: NotificationItem;
  onMarkRead: (id: string) => void;
  marking: boolean;
}) {
  const t = useTranslations('notifications');
  const unread = item.read_at === null;

  return (
    <article className="rounded-lg border border-border bg-bg-card p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {unread ? <span className="h-2 w-2 rounded-full bg-coral" aria-hidden="true" /> : null}
            <h2 className="font-semibold">{item.title}</h2>
          </div>
          <p className="mt-2 text-sm text-text-secondary">{item.body}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href={item.href} onClick={() => onMarkRead(item.id)}>
              {t('open_tracking')}
            </Link>
          </Button>
          {unread ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={marking}
              onClick={() => onMarkRead(item.id)}
            >
              {t('mark_read')}
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function NotificationsPage() {
  const t = useTranslations('notifications');
  const notifications = useMyNotifications({ limit: 20, offset: 0 });
  const markRead = useMarkNotificationRead();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const pendingItems = (notifications.data?.items ?? []).filter(
    (item) => item.read_at === null && !dismissedIds.includes(item.id),
  );

  function dismissNotification(id: string) {
    setDismissedIds((current) => (current.includes(id) ? current : [...current, id]));
    markRead.mutate(id);
  }

  return (
    <main className="container mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="mt-2 text-sm text-text-secondary">{t('subtitle')}</p>
      </header>

      {notifications.isLoading ? (
        <div className="rounded-lg border border-border bg-bg-card p-5 text-sm text-text-secondary">
          {t('loading')}
        </div>
      ) : null}

      {notifications.isError ? (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-5 text-sm text-red-700"
        >
          {t('load_error')}
        </div>
      ) : null}

      {!notifications.isLoading && !notifications.isError ? (
        <div className="space-y-3">
          {pendingItems.length > 0 ? (
            pendingItems.map((item) => (
              <NotificationRow
                key={item.id}
                item={item}
                marking={markRead.isPending}
                onMarkRead={dismissNotification}
              />
            ))
          ) : (
            <div className="rounded-lg border border-border bg-bg-card p-5 text-sm text-text-secondary">
              {t('empty')}
            </div>
          )}
        </div>
      ) : null}
    </main>
  );
}
