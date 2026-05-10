import { z } from 'zod';
import { IsoDateTime, Uuid } from './common';

export const Gender = z.enum(['male', 'female', 'other', 'prefer_not_to_say']);
export const ShirtSize = z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL']);

export const RegisterInput = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(1),
  dni: z.string().min(8).max(12),
  gender: Gender,
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type RegisterInput = z.infer<typeof RegisterInput>;

export const LoginInput = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginInput = z.infer<typeof LoginInput>;

export const RunnerProfile = z.object({
  estimated_time_min: z.number().int().positive().nullable().optional(),
  shirt_size: ShirtSize.nullable().optional(),
  club: z.string().nullable().optional(),
  allergies: z.string().nullable().optional(),
});
export type RunnerProfile = z.infer<typeof RunnerProfile>;

export const ContactAddress = z.object({
  phone: z.string().nullable().optional(),
  address_line: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
});

export const User = z.object({
  id: Uuid,
  email: z.string().email(),
  full_name: z.string(),
  dni: z.string(),
  gender: Gender,
  birth_date: z.string(),
  avatar_url: z.string().url().nullable(),
  rating_average: z.number().min(0).max(5).nullable(),
  total_sales: z.number().int().nonnegative().default(0),
  total_purchases: z.number().int().nonnegative().default(0),
  contact: ContactAddress.optional(),
  runner: RunnerProfile.optional(),
  created_at: IsoDateTime,
  updated_at: IsoDateTime,
});
export type User = z.infer<typeof User>;

export const SessionUser = z.object({
  id: Uuid,
  email: z.string().email(),
  name: z.string(),
  image: z.string().url().nullable().optional(),
});
export type SessionUser = z.infer<typeof SessionUser>;
