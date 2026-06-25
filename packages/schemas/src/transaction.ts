import { z } from 'zod';
import { IsoDateTime, Uuid } from './common';
import { ShirtSize } from './user';

// Canonical Transaction status set returned by the backend (Transaction bounded
// context). Single source of truth — the legacy lowercase aliases were removed
// (issue #7) once Catalog/Transaction shipped real uppercase contracts.
export const TransactionStatus = z.enum([
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

const Contact = z.object({
  full_name: z.string().nullable(),
  phone_number: z.string().nullable(),
  whatsapp_number: z.string().nullable(),
  email: z.string().nullable(),
});

export const SellerContact = Contact.extend({
  seller_id: Uuid,
});
export type SellerContact = z.infer<typeof SellerContact>;

export const BuyerContact = Contact.extend({
  buyer_id: Uuid,
});
export type BuyerContact = z.infer<typeof BuyerContact>;

export const BuyerTransferProfile = z.object({
  buyer_id: Uuid,
  full_name: z.string().nullable(),
  dni: z.string().nullable(),
  phone_number: z.string().nullable(),
  whatsapp_number: z.string().nullable(),
  t_shirt_size: z.string().nullable(),
  estimated_time: z.string().nullable(),
  medical_info: z.string().nullable(),
  emergency_contact: z.string().nullable(),
});
export type BuyerTransferProfile = z.infer<typeof BuyerTransferProfile>;

export const OrderSummary = z.object({
  dorsal_id: Uuid,
  race_name: z.string().nullable(),
  bib_number: z.string().nullable(),
  amount_eur: z.coerce.number().nonnegative(),
});
export type OrderSummary = z.infer<typeof OrderSummary>;

const BackendDetailBase = z.object({
  transaction_id: Uuid,
  status: TransactionStatus,
  lifecycle_state: z.string(),
  order_summary: OrderSummary,
  timeline: z.array(z.union([TimelineEvent, BackendTimelineEvent])),
  seller_deadline_at: IsoDateTime.nullable(),
  buyer_deadline_at: IsoDateTime.nullable(),
});

export const BuyerTransactionDetail = BackendDetailBase.extend({
  seller_contact: SellerContact,
  buyer_data_checklist: z.array(z.record(z.unknown())),
});
export type BuyerTransactionDetail = z.infer<typeof BuyerTransactionDetail>;

export const SellerTransactionDetail = BackendDetailBase.extend({
  buyer_contact: BuyerContact,
  buyer_profile: BuyerTransferProfile.nullable(),
});
export type SellerTransactionDetail = z.infer<typeof SellerTransactionDetail>;

export const Transaction = z.union([BuyerTransactionDetail, SellerTransactionDetail]);
export type Transaction = z.infer<typeof Transaction>;

export const ReserveListingResponse = z.object({
  transaction_id: Uuid,
  payment_client_secret: z.string(),
  reservation_expires_at: IsoDateTime,
});
export type ReserveListingResponse = z.infer<typeof ReserveListingResponse>;

export const RunnerDataInput = z.object({
  estimated_time: z
    .string()
    .regex(/^\d{2}:\d{2}:\d{2}$/)
    .optional(),
  t_shirt_size: ShirtSize.optional(),
  emergency_contact: z.string().max(120).optional(),
});
export type RunnerDataInput = z.infer<typeof RunnerDataInput>;

export const SellerOnboardingResponse = z.object({
  account_id: z.string().optional(),
  onboarding_url: z.string().url().nullable(),
  charges_enabled: z.boolean().optional(),
});
export type SellerOnboardingResponse = z.infer<typeof SellerOnboardingResponse>;

export const ProofUploadUrlResponse = z.object({
  upload_url: z.string().url(),
  file_url: z.string(),
  upload_method: z.enum(['PUT', 'POST']).optional(),
  fields: z.record(z.string()).optional(),
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
  transaction_id: Uuid,
  race_name: z.string().nullable(),
  race_date: z.string().nullable(),
  distance: z.string().nullable(),
  location: z.string().nullable(),
  payment_method: z.string(),
  price: z.coerce.number().nonnegative(),
  technical_status: z.string(),
  ui_status: z.string(),
  ui_status_label: z.string(),
});
export type TransactionListItem = z.infer<typeof TransactionListItem>;

export const TransactionListResponse = z.object({
  items: z.array(TransactionListItem),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
});
export type TransactionListResponse = z.infer<typeof TransactionListResponse>;
