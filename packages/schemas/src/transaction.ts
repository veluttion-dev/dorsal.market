import { z } from 'zod';
import { IsoDateTime, Uuid } from './common';

export const TransactionStatus = z.enum([
  'payment_held',
  'data_sent',
  'change_in_progress',
  'change_confirmed',
  'released',
  'disputed',
  'cancelled',
  'refunded',
]);
export type TransactionStatus = z.infer<typeof TransactionStatus>;

export const TimelineStepKey = z.enum([
  'payment_held',
  'data_sent',
  'change_in_progress',
  'change_confirmed',
  'released',
]);
export const TimelineStep = z.object({
  step: TimelineStepKey,
  completed: z.boolean(),
  completed_at: IsoDateTime.nullable(),
});
export type TimelineStep = z.infer<typeof TimelineStep>;

export const PurchaseInput = z.object({
  dorsal_id: Uuid,
  payment_method: z.enum(['card']),
});
export type PurchaseInput = z.infer<typeof PurchaseInput>;

export const Transaction = z.object({
  id: Uuid,
  dorsal_id: Uuid,
  buyer_id: Uuid,
  seller_id: Uuid,
  amount: z.number().nonnegative(),
  currency: z.literal('EUR'),
  status: TransactionStatus,
  stripe_payment_intent_id: z.string().nullable(),
  timeline: z.array(TimelineStep),
  created_at: IsoDateTime,
  updated_at: IsoDateTime,
});
export type Transaction = z.infer<typeof Transaction>;

export const Dispute = z.object({
  id: Uuid,
  transaction_id: Uuid,
  opened_by: Uuid,
  reason: z.string(),
  evidence_urls: z.array(z.string().url()).default([]),
  status: z.enum(['open', 'investigating', 'resolved_buyer', 'resolved_seller']),
  created_at: IsoDateTime,
});
export type Dispute = z.infer<typeof Dispute>;

export const ChatMessage = z.object({
  id: Uuid,
  transaction_id: Uuid,
  sender_id: Uuid,
  content: z.string(),
  created_at: IsoDateTime,
});
export type ChatMessage = z.infer<typeof ChatMessage>;
