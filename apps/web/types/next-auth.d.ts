import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: { id: string; token?: string } & DefaultSession['user'];
  }
  interface User {
    id: string;
    token?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    authToken?: string;
    authTokenExpiresAt?: number | null;
    refreshToken?: string;
    authTokenError?: 'RefreshAccessTokenError' | undefined;
  }
}
