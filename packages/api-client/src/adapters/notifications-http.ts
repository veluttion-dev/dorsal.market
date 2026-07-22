import { MarkNotificationReadResponse, NotificationListResponse } from '@dorsal/schemas';
import type { HttpClient } from '../http';
import type { NotificationsPort } from '../ports';

export class NotificationsHttpAdapter implements NotificationsPort {
  constructor(private http: HttpClient) {}

  async listMyNotifications(query?: { limit?: number; offset?: number }) {
    return NotificationListResponse.parse(
      await this.http.get('api/v1/me/notifications', { query: query ?? {} }),
    );
  }

  async markRead(notificationId: string) {
    return MarkNotificationReadResponse.parse(
      await this.http.post(`api/v1/me/notifications/${notificationId}/read`),
    );
  }
}
