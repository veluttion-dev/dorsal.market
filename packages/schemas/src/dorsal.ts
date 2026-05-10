import { z } from 'zod';
import { IsoDate, IsoDateTime, Pagination, Uuid } from './common';

export const Distance = z.enum(['5k', '10k', '21k', '42k', 'trail', 'ultra']);
export type Distance = z.infer<typeof Distance>;

export const PaymentMethod = z.enum(['bizum', 'paypal', 'card']);
export type PaymentMethod = z.infer<typeof PaymentMethod>;

export const DorsalStatus = z.enum(['draft', 'published', 'sold', 'cancelled']);
export type DorsalStatus = z.infer<typeof DorsalStatus>;

export const IncludedItems = z.object({
  chip: z.boolean(),
  shirt: z.boolean(),
  bag: z.boolean(),
  medal: z.boolean(),
  refreshments: z.boolean(),
});
export type IncludedItems = z.infer<typeof IncludedItems>;

export const ContactInfo = z.object({
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone_visible: z.boolean(),
  email_visible: z.boolean(),
});
export type ContactInfo = z.infer<typeof ContactInfo>;

export const DorsalSummary = z.object({
  id: Uuid,
  race_name: z.string(),
  race_date: IsoDate.nullable(),
  location: z.string(),
  distance: Distance,
  price_amount: z.coerce.number().nonnegative(),
  payment_methods: z.array(PaymentMethod),
  photo_url: z.string().url(),
  status: DorsalStatus,
});
export type DorsalSummary = z.infer<typeof DorsalSummary>;

export const DorsalDetail = DorsalSummary.extend({
  bib_number: z.string().nullable(),
  start_corral: z.string().nullable(),
  included_items: IncludedItems,
  contact_phone: z.string().nullable(),
  contact_email: z.string().email().nullable(),
  sale_reason: z.string().nullable(),
  seller_id: Uuid,
  created_at: IsoDateTime,
  updated_at: IsoDateTime,
});
export type DorsalDetail = z.infer<typeof DorsalDetail>;

export const DorsalListResponse = z
  .object({
    items: z.array(DorsalSummary),
  })
  .merge(Pagination);
export type DorsalListResponse = z.infer<typeof DorsalListResponse>;

export const PublishDorsalInput = z
  .object({
    publish: z.boolean(),
    photo_url: z.string().url(),
    race_name: z.string().min(1).optional(),
    bib_number: z.string().min(1).optional(),
    race_date: IsoDate.optional(),
    location: z.string().min(1).optional(),
    distance: Distance.optional(),
    start_corral: z.string().nullable().optional(),
    included_items: IncludedItems.optional(),
    price_amount: z.coerce.number().nonnegative().optional(),
    payment_methods: z.array(PaymentMethod).optional(),
    contact: ContactInfo.optional(),
    sale_reason: z.string().nullable().optional(),
  })
  .refine(
    (v) =>
      !v.publish ||
      (v.race_name &&
        v.race_date &&
        v.location &&
        v.distance &&
        v.included_items &&
        v.price_amount !== undefined &&
        v.payment_methods?.length &&
        v.contact),
    { message: 'When publish=true, all required fields must be provided', path: ['publish'] },
  );
export type PublishDorsalInput = z.infer<typeof PublishDorsalInput>;

export const PublishDorsalResponse = z.object({
  dorsal_id: Uuid,
  status: DorsalStatus,
});
export type PublishDorsalResponse = z.infer<typeof PublishDorsalResponse>;

export const SearchDorsalsQuery = z.object({
  race_name: z.string().optional(),
  distance: z.array(Distance).optional(),
  price_min: z.coerce.number().nonnegative().optional(),
  price_max: z.coerce.number().nonnegative().optional(),
  payment_method: PaymentMethod.optional(),
  location: z.string().optional(),
  date_from: IsoDate.optional(),
  date_to: IsoDate.optional(),
  sort_by: z.enum(['price', 'race_date', 'created_at']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().positive().optional(),
  page_size: z.coerce.number().int().positive().max(100).optional(),
});
export type SearchDorsalsQuery = z.infer<typeof SearchDorsalsQuery>;
