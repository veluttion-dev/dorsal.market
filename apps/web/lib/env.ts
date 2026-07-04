import { z } from 'zod';

const emptyStringToUndefined = (value: unknown) => (value === '' ? undefined : value);
const optionalString = z.preprocess(emptyStringToUndefined, z.string().optional());
const optionalUrl = z.preprocess(emptyStringToUndefined, z.string().url().optional());
const optionalEmail = z.preprocess(emptyStringToUndefined, z.string().email().optional());

const ServerEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXTAUTH_SECRET: z.string().min(16),
  NEXTAUTH_URL: optionalUrl,
  BACKEND_API_URL: z.string().url(),
  AUTH_COGNITO_ID: optionalString,
  AUTH_COGNITO_ISSUER: optionalUrl,
  AUTH_COGNITO_CLIENT_SECRET: optionalString,
  AUTH_COGNITO_DOMAIN: optionalString,
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  FACEBOOK_CLIENT_ID: optionalString,
  FACEBOOK_CLIENT_SECRET: optionalString,
  RESEND_API_KEY: optionalString,
  FEEDBACK_TO_EMAIL: optionalEmail,
  FEEDBACK_FROM_EMAIL: optionalString,
});

const PublicEnvSchema = z.object({
  NEXT_PUBLIC_BACKEND_API_URL: z.string().url(),
  NEXT_PUBLIC_REAL_API_MODULES: z.string().default(''),
  NEXT_PUBLIC_SITE_URL: optionalUrl,
});

const parsedServer = ServerEnvSchema.safeParse(process.env);
if (!parsedServer.success) {
  console.error('Invalid server env:', parsedServer.error.flatten().fieldErrors);
  throw new Error('Invalid server environment variables');
}

const parsedPublic = PublicEnvSchema.safeParse({
  NEXT_PUBLIC_BACKEND_API_URL: process.env.NEXT_PUBLIC_BACKEND_API_URL,
  NEXT_PUBLIC_REAL_API_MODULES: process.env.NEXT_PUBLIC_REAL_API_MODULES,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});
if (!parsedPublic.success) {
  throw new Error('Invalid public env');
}

export const env = { ...parsedServer.data, ...parsedPublic.data };
