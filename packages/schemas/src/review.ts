import { z } from 'zod';
import { IsoDateTime, Uuid } from './common';

export const Review = z.object({
  id: Uuid,
  transaction_id: Uuid,
  reviewer_id: Uuid,
  reviewee_id: Uuid,
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  created_at: IsoDateTime,
});
export type Review = z.infer<typeof Review>;

export const CreateReviewInput = z.object({
  transaction_id: Uuid,
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});
export type CreateReviewInput = z.infer<typeof CreateReviewInput>;
