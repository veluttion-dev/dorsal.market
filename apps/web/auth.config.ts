import type { NextAuthConfig } from 'next-auth';

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
    jwt({ token, user }) {
      if (user) token.userId = (user as { id?: string }).id;
      return token;
    },
    session({ session, token }) {
      if (token.userId) session.user.id = token.userId as string;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
