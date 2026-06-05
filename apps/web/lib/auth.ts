import { createApi } from '@dorsal/api-client';
import NextAuth, { type NextAuthConfig } from 'next-auth';
import Cognito from 'next-auth/providers/cognito';
import Credentials from 'next-auth/providers/credentials';
import Facebook from 'next-auth/providers/facebook';
import Google from 'next-auth/providers/google';
import { z } from 'zod';
import { authConfig } from '../auth.config';
import { isUsersMocked } from '../features/users/lib/auth-mode';
import { buildMockAuthToken } from '../features/users/lib/mock-auth-token';
import { env } from './env';

const Creds = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  dev_user_id: z.string().uuid().optional(),
  dev_name: z.string().optional(),
});

const providers: NextAuthConfig['providers'] = [
  Credentials({
    credentials: { email: {}, password: {}, dev_user_id: {}, dev_name: {} },
    async authorize(raw) {
      const parsed = Creds.safeParse(raw);
      if (!parsed.success) return null;
      const allowMock =
        env.NODE_ENV === 'development' && isUsersMocked(env.NEXT_PUBLIC_REAL_API_MODULES);
      if (allowMock && parsed.data.dev_user_id) {
        const token = buildMockAuthToken({
          id: parsed.data.dev_user_id,
          email: parsed.data.email,
          name: parsed.data.dev_name ?? parsed.data.email,
        });
        return {
          id: parsed.data.dev_user_id,
          email: parsed.data.email,
          name: parsed.data.dev_name ?? parsed.data.email,
          image: null,
          ...(token ? { token } : {}),
        };
      }
      if (
        allowMock &&
        parsed.data.email === 'demo@dorsal.market' &&
        parsed.data.password === 'demo1234'
      ) {
        const token = buildMockAuthToken({
          id: '550e8400-e29b-41d4-a716-446655440001',
          email: 'demo@dorsal.market',
          name: 'Carlos Martinez',
        });
        return {
          id: '550e8400-e29b-41d4-a716-446655440001',
          email: 'demo@dorsal.market',
          name: 'Carlos Martinez',
          image: null,
          ...(token ? { token } : {}),
        };
      }
      if (!allowMock) return null;
      const api = createApi({ baseUrl: env.BACKEND_API_URL, getUserId: () => null });
      try {
        const u = await api.users.login(parsed.data.email, parsed.data.password);
        return {
          id: u.id,
          email: u.email,
          name: u.name,
          image: u.image ?? null,
          ...(u.token ? { token: u.token } : {}),
        };
      } catch {
        return null;
      }
    },
  }),
];

if (env.AUTH_COGNITO_ID && env.AUTH_COGNITO_ISSUER) {
  providers.push(
    Cognito({
      clientId: env.AUTH_COGNITO_ID,
      clientSecret: env.AUTH_COGNITO_CLIENT_SECRET ?? '',
      issuer: env.AUTH_COGNITO_ISSUER,
    }),
  );
}

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({ clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }),
  );
}
if (env.FACEBOOK_CLIENT_ID && env.FACEBOOK_CLIENT_SECRET) {
  providers.push(
    Facebook({ clientId: env.FACEBOOK_CLIENT_ID, clientSecret: env.FACEBOOK_CLIENT_SECRET }),
  );
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  session: { strategy: 'jwt' },
  secret: env.NEXTAUTH_SECRET,
});
