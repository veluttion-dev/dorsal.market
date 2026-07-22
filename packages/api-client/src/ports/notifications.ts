import type { MarkNotificationReadResponse, NotificationListResponse } from '@dorsal/schemas';

export interface NotificationsPort {
  listMyNotifications(query?: {
    limit?: number;
    offset?: number;
  }): Promise<NotificationListResponse>;
  markRead(notificationId: string): Promise<MarkNotificationReadResponse>;
}
