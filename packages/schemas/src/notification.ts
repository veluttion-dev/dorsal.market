import { z } from 'zod';
import { IsoDateTime, Uuid } from './common';

export const NotificationItem = z.object({
  id: Uuid,
  user_id: Uuid,
  type: z.string(),
  title: z.string(),
  body: z.string(),
  transaction_id: Uuid.nullable(),
  href: z.string(),
  read_at: IsoDateTime.nullable(),
  created_at: IsoDateTime,
});
export type NotificationItem = z.infer<typeof NotificationItem>;

export const NotificationListResponse = z.object({
  items: z.array(NotificationItem),
  unread_count: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
});
export type NotificationListResponse = z.infer<typeof NotificationListResponse>;

export const MarkNotificationReadResponse = z.object({
  notification_id: Uuid,
  read_at: IsoDateTime,
});
export type MarkNotificationReadResponse = z.infer<typeof MarkNotificationReadResponse>;
