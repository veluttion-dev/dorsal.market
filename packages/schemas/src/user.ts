import { z } from 'zod';
import { Uuid } from './common';

export const Gender = z.enum(['male', 'female', 'other', 'prefer_not_to_say']);
export type Gender = z.infer<typeof Gender>;
export const ShirtSize = z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL']);
export type ShirtSize = z.infer<typeof ShirtSize>;

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
  whatsapp_number: z.string().nullable().optional(),
  estimated_time: z
    .string()
    .regex(/^\d{2}:\d{2}:\d{2}$/)
    .nullable()
    .optional(),
  t_shirt_size: ShirtSize.nullable().optional(),
  club: z.string().nullable().optional(),
  federation_license: z.string().nullable().optional(),
  medical_info: z.string().nullable().optional(),
  emergency_contact: z.string().nullable().optional(),
  additional_info: z.string().nullable().optional(),
});
export type RunnerProfile = z.infer<typeof RunnerProfile>;

export const ContactAddress = z.object({
  phone_number: z.string().nullable().optional(),
  whatsapp_number: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
});

export const UserProfile = z.object({
  id: Uuid,
  email: z.string().email(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  dni: z.string().nullable(),
  gender: Gender.nullable(),
  age: z.number().int().min(14).max(120).nullable(),
  phone_number: z.string().nullable(),
  whatsapp_number: z.string().nullable().optional(),
  postal_code: z.string().nullable(),
  address: z.string().nullable(),
  estimated_time: z
    .string()
    .regex(/^\d{2}:\d{2}:\d{2}$/)
    .nullable(),
  t_shirt_size: ShirtSize.nullable(),
  club: z.string().nullable(),
  federation_license: z.string().nullable(),
  medical_info: z.string().nullable(),
  emergency_contact: z.string().nullable(),
  additional_info: z.string().nullable(),
  profile_complete: z.boolean(),
  runner_data_complete: z.boolean(),
});
export type UserProfile = z.infer<typeof UserProfile>;

export const PatchUserProfileInput = UserProfile.omit({
  id: true,
  email: true,
  whatsapp_number: true,
  profile_complete: true,
  runner_data_complete: true,
}).partial();
export type PatchUserProfileInput = z.infer<typeof PatchUserProfileInput>;

export const PublicUserProfile = z.object({
  id: Uuid,
  full_name: z.string().nullable(),
  avg_rating_seller: z.coerce.number().nullable(),
  avg_rating_buyer: z.coerce.number().nullable(),
  total_sales: z.number().int().nonnegative(),
  total_purchases: z.number().int().nonnegative(),
  profile_complete: z.boolean(),
});
export type PublicUserProfile = z.infer<typeof PublicUserProfile>;

export const User = UserProfile;
export type User = UserProfile;

export const SessionUser = z.object({
  id: Uuid,
  email: z.string().email(),
  name: z.string(),
  image: z.string().url().nullable().optional(),
  token: z.string().optional(),
});
export type SessionUser = z.infer<typeof SessionUser>;
