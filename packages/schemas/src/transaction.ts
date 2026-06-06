import { z } from 'zod';
import { IsoDateTime, Uuid } from './common';

export const TransactionStatus = z.enum([
  'reserved',
  'paid',
  'transfer_in_progress',
  'transfer_proof_submitted',
  'confirmed',
  'released_to_seller',
  'refunded_to_buyer',
  'disputed',
  'expired',
  'cancelled',
  'PENDING_PAYMENT',
  'PAYMENT_RECEIVED',
  'TRANSFER_IN_PROGRESS',
  'TRANSFER_SUBMITTED',
  'IN_DISPUTE',
  'RELEASED_TO_SELLER',
  'REFUNDED_TO_BUYER',
  'CANCELLED',
]);
export type TransactionStatus = z.infer<typeof TransactionStatus>;

export const TimelineEventType = z.enum([
  'reservation_created',
  'payment_succeeded',
  'transfer_in_progress',
  'proof_submitted',
  'transfer_confirmed',
  'funds_released',
  'dispute_opened',
  'dispute_resolved',
  'refunded',
]);
export type TimelineEventType = z.infer<typeof TimelineEventType>;

export const TimelineEvent = z.object({
  type: TimelineEventType,
  at: IsoDateTime,
  actor: z.enum(['buyer', 'seller', 'system', 'admin']).nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
});
export const BackendTimelineEvent = z.object({
  key: z.string(),
  label: z.string(),
  completed_at: IsoDateTime.nullable(),
});
export type TimelineEvent = z.infer<typeof TimelineEvent> | z.infer<typeof BackendTimelineEvent>;

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

export const BuyerTransactionDetail = z.object({
  id: Uuid,
  dorsal_id: Uuid,
  buyer_id: Uuid,
  seller_id: Uuid,
  status: TransactionStatus,
  amount: z.coerce.number().nonnegative(),
  currency: z.literal('EUR'),
  stripe_payment_intent_client_secret: z.string().nullable(),
  proof_file_url: z.string().url().nullable(),
  timeline: z.array(TimelineEvent),
  dorsal_snapshot: z.object({
    race_name: z.string(),
    race_date: z.string().nullable(),
    location: z.string(),
    distance: z.string(),
    photo_url: z.string().url(),
  }),
  created_at: IsoDateTime,
  updated_at: IsoDateTime,
});
export type BuyerTransactionDetail = z.infer<typeof BuyerTransactionDetail>;

export const SellerTransactionDetail = z.object({
  id: Uuid,
  dorsal_id: Uuid,
  buyer_id: Uuid,
  seller_id: Uuid,
  status: TransactionStatus,
  amount: z.coerce.number().nonnegative(),
  currency: z.literal('EUR'),
  proof_file_url: z.string().url().nullable(),
  timeline: z.array(TimelineEvent),
  buyer_snapshot: z.object({
    full_name: z.string(),
    dni: z.string(),
    email: z.string().email(),
    phone: z.string().nullable(),
    birth_date: z.string(),
    runner: z
      .object({
        shirt_size: z.string().nullable(),
        club: z.string().nullable(),
      })
      .optional(),
  }),
  created_at: IsoDateTime,
  updated_at: IsoDateTime,
});
export type SellerTransactionDetail = z.infer<typeof SellerTransactionDetail>;

export const Transaction = z.union([BuyerTransactionDetail, SellerTransactionDetail]);
export type Transaction = z.infer<typeof Transaction>;

export const ReserveListingResponse = z.object({
  transaction_id: Uuid,
  stripe_payment_intent_client_secret: z.string(),
  amount: z.coerce.number().nonnegative(),
  expires_at: IsoDateTime,
});
export type ReserveListingResponse = z.infer<typeof ReserveListingResponse>;

export const SellerOnboardingResponse = z.object({
  account_id: z.string(),
  onboarding_url: z.string().url().nullable(),
  charges_enabled: z.boolean(),
});
export type SellerOnboardingResponse = z.infer<typeof SellerOnboardingResponse>;

export const ProofUploadUrlResponse = z.object({
  upload_url: z.string().url(),
  upload_method: z.enum(['PUT', 'POST']),
  fields: z.record(z.string()).optional(),
  final_url: z.string().url(),
});
export type ProofUploadUrlResponse = z.infer<typeof ProofUploadUrlResponse>;

export const Dispute = z.object({
  id: Uuid,
  transaction_id: Uuid,
  opened_by: Uuid,
  reason: z.string(),
  status: z.enum(['open', 'in_review', 'resolved_buyer', 'resolved_seller']),
  resolution_notes: z.string().nullable(),
  created_at: IsoDateTime,
});
export type Dispute = z.infer<typeof Dispute>;

export const SellerProblemCategory = z.enum([
  'buyer_data_issue',
  'race_rejected_transfer',
  'payment_or_payout_issue',
  'other',
]);
export type SellerProblemCategory = z.infer<typeof SellerProblemCategory>;

export const SellerProblemReport = z.object({
  id: Uuid,
  transaction_id: Uuid,
  seller_id: Uuid,
  category: SellerProblemCategory,
  message: z.string(),
  attachments: z.array(z.string().url()).default([]),
  status: z.enum(['open', 'in_review', 'resolved']),
  resolution_notes: z.string().nullable(),
  created_at: IsoDateTime,
});
export type SellerProblemReport = z.infer<typeof SellerProblemReport>;

export const TransactionListItem = z.object({
  id: Uuid,
  dorsal_id: Uuid,
  status: TransactionStatus,
  amount: z.coerce.number().nonnegative(),
  counterparty_name: z.string(),
  race_name: z.string(),
  created_at: IsoDateTime,
});
export type TransactionListItem = z.infer<typeof TransactionListItem>;

export const TransactionListResponse = z.object({
  items: z.array(TransactionListItem),
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
});
export type TransactionListResponse = z.infer<typeof TransactionListResponse>;
