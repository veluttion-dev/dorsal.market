import { z } from 'zod';

export const Uuid = z.string().uuid();
export type Uuid = z.infer<typeof Uuid>;

export const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD');
export const IsoDateTime = z.string().datetime();

export const Pagination = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
  total_pages: z.number().int().nonnegative(),
});
export type Pagination = z.infer<typeof Pagination>;

export const ErrorResponse = z.object({
  detail: z.union([
    z.string(),
    z.array(
      z.object({
        loc: z.array(z.union([z.string(), z.number()])),
        msg: z.string(),
        type: z.string(),
      }),
    ),
  ]),
});
export type ErrorResponse = z.infer<typeof ErrorResponse>;
