import type { NextAuthConfig } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

const TOKEN_REFRESH_WINDOW_SECONDS = 60;

type AccountAuthToken = {
  id_token?: string | null;
  access_token?: string | null;
  refresh_token?: string | null;
  expires_at?: number | null;
  expires_in?: number | null;
};

type RefreshOptions = {
  clientId: string;
  issuer: string;
  clientSecret?: string;
  nowSeconds?: number;
  fetchFn?: typeof fetch;
};

export function selectAccountAuthToken(account: AccountAuthToken | null | undefined) {
  return account?.id_token ?? account?.access_token ?? null;
}

export function getAccountTokenExpiresAt(
  account: AccountAuthToken | null | undefined,
  nowSeconds = Math.floor(Date.now() / 1000),
) {
  return account?.expires_at ?? (account?.expires_in ? nowSeconds + account.expires_in : null);
}

export function isAuthTokenExpired(
  expiresAt: number | null | undefined,
  nowSeconds = Math.floor(Date.now() / 1000),
) {
  if (!expiresAt) return false;
  return nowSeconds >= expiresAt - TOKEN_REFRESH_WINDOW_SECONDS;
}

function optionalEnv(value: string | undefined) {
  return value?.trim() ? value : undefined;
}

function buildClientAuthorization(clientId: string, clientSecret: string) {
  return `Basic ${btoa(`${clientId}:${clientSecret}`)}`;
}

export async function refreshCognitoAuthToken(token: JWT, options: RefreshOptions): Promise<JWT> {
  if (!token.refreshToken) return token;

  const fetchFn = options.fetchFn ?? fetch;
  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: options.clientId,
    refresh_token: token.refreshToken,
  });
  const headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });
  if (options.clientSecret) {
    headers.set('Authorization', buildClientAuthorization(options.clientId, options.clientSecret));
  }

  const response = await fetchFn(`${options.issuer}/oauth2/token`, {
    method: 'POST',
    headers,
    body,
  });

  if (!response.ok) {
    return { ...token, authTokenError: 'RefreshAccessTokenError' };
  }

  const refreshed = (await response.json()) as AccountAuthToken;
  const authToken = selectAccountAuthToken(refreshed);
  if (!authToken) {
    return { ...token, authTokenError: 'RefreshAccessTokenError' };
  }

  const { authTokenError: _authTokenError, ...validToken } = token;

  return {
    ...validToken,
    authToken,
    authTokenExpiresAt: getAccountTokenExpiresAt(refreshed, nowSeconds),
    refreshToken: refreshed.refresh_token ?? token.refreshToken,
  };
}

export function isProtectedPath(pathname: string) {
  return (
    pathname.startsWith('/vender') ||
    pathname.startsWith('/perfil') ||
    pathname.startsWith('/compra')
  );
}

export const authConfig = {
  pages: { signIn: '/login' },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = isProtectedPath(nextUrl.pathname);
      if (isProtected && !isLoggedIn) return false;
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        const userId = (user as { id?: string }).id;
        if (userId) token.userId = userId;
        const authToken = (user as { token?: string }).token;
        if (authToken) token.authToken = authToken;
      }
      const accountToken = selectAccountAuthToken(account);
      if (accountToken) {
        token.authToken = accountToken;
        token.authTokenExpiresAt = getAccountTokenExpiresAt(account);
        if (account?.refresh_token) token.refreshToken = account.refresh_token;
      }
      const clientId = optionalEnv(process.env.AUTH_COGNITO_ID);
      const issuer = optionalEnv(process.env.AUTH_COGNITO_ISSUER);
      if (
        !account &&
        clientId &&
        issuer &&
        token.authToken &&
        token.refreshToken &&
        isAuthTokenExpired(token.authTokenExpiresAt)
      ) {
        const refreshOptions: RefreshOptions = {
          clientId,
          issuer,
        };
        const clientSecret = optionalEnv(process.env.AUTH_COGNITO_CLIENT_SECRET);
        if (clientSecret) refreshOptions.clientSecret = clientSecret;
        return refreshCognitoAuthToken(token, refreshOptions);
      }
      return token;
    },
    session({ session, token }) {
      const userId = token.userId ?? token.sub;
      if (userId) session.user.id = userId as string;
      if (token.authToken && !token.authTokenError) {
        session.user.token = token.authToken as string;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
