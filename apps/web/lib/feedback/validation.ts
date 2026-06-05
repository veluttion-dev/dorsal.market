import { z } from 'zod';

export const FeedbackInputSchema = z.object({
  message: z.string().trim().min(20).max(4000),
  contactEmail: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().email().optional(),
  ),
  pageUrl: z.string().url().optional(),
  userAgent: z.string().max(1000).optional(),
  userId: z.string().optional(),
  userEmail: z.string().email().optional(),
  userName: z.string().max(200).optional(),
  submittedAt: z.string().datetime(),
});
