import { z } from 'zod';

const ServerEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXTAUTH_SECRET: z.string().min(16),
  NEXTAUTH_URL: z.string().url().optional(),
  BACKEND_API_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_CLIENT_ID: z.string().optional(),
  FACEBOOK_CLIENT_SECRET: z.string().optional(),
});

const PublicEnvSchema = z.object({
  NEXT_PUBLIC_BACKEND_API_URL: z.string().url(),
  NEXT_PUBLIC_REAL_API_MODULES: z.string().default(''),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
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
