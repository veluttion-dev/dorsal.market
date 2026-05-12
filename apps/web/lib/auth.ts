import { createApi } from '@dorsal/api-client';
import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Facebook from 'next-auth/providers/facebook';
import Google from 'next-auth/providers/google';
import { z } from 'zod';
import { authConfig } from '../auth.config';
import { env } from './env';

const Creds = z.object({ email: z.string().email(), password: z.string().min(8) });

const providers: NextAuthConfig['providers'] = [
  Credentials({
    credentials: { email: {}, password: {} },
    async authorize(raw) {
      const parsed = Creds.safeParse(raw);
      if (!parsed.success) return null;
      const api = createApi({ baseUrl: env.BACKEND_API_URL, getUserId: () => null });
      try {
        const u = await api.users.login(parsed.data.email, parsed.data.password);
        return { id: u.id, email: u.email, name: u.name, image: u.image ?? null };
      } catch {
        return null;
      }
    },
  }),
];

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
