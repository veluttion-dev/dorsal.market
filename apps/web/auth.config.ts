import type { NextAuthConfig } from 'next-auth';

export function selectAccountAuthToken(
  account:
    | {
        id_token?: string | null;
        access_token?: string | null;
      }
    | null
    | undefined,
) {
  return account?.id_token ?? account?.access_token ?? null;
}

export const authConfig = {
  pages: { signIn: '/login' },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected =
        nextUrl.pathname.startsWith('/vender') ||
        nextUrl.pathname.startsWith('/perfil') ||
        nextUrl.pathname.startsWith('/compra');
      if (isProtected && !isLoggedIn) return false;
      return true;
    },
    jwt({ token, user, account }) {
      if (user) {
        token.userId = (user as { id?: string }).id;
        const authToken = (user as { token?: string }).token;
        if (authToken) token.authToken = authToken;
      }
      const accountToken = selectAccountAuthToken(account);
      if (accountToken) token.authToken = accountToken;
      return token;
    },
    session({ session, token }) {
      const userId = token.userId ?? token.sub;
      if (userId) session.user.id = userId as string;
      if (token.authToken) session.user.token = token.authToken as string;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
