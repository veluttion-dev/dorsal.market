'use client';
import { Button } from '@/components/ui/button';
import { useMyNotifications } from '@/features/notifications/hooks/use-my-notifications';
import { Bell } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export function NotificationBell() {
  const t = useTranslations('notifications');
  const notifications = useMyNotifications({ limit: 10, offset: 0 });
  const unreadCount = notifications.data?.unread_count ?? 0;
  const label = unreadCount > 0 ? t('nav_label_unread', { count: unreadCount }) : t('nav_label');

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="relative"
      aria-label={label}
      title={label}
    >
      <Link href="/perfil/notificaciones">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="-right-1 -top-1 absolute flex h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
