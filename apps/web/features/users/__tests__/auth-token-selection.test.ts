import {
  authConfig,
  isAuthTokenExpired,
  refreshCognitoAuthToken,
  selectAccountAuthToken,
} from '@/auth.config';
import { describe, expect, it } from 'vitest';

describe('selectAccountAuthToken', () => {
  it('prefers the Cognito id token because backend Identity requires an email claim', () => {
    expect(selectAccountAuthToken({ access_token: 'access-token', id_token: 'id-token' })).toBe(
      'id-token',
    );
  });

  it('falls back to the access token when no id token is available', () => {
    expect(selectAccountAuthToken({ access_token: 'access-token' })).toBe('access-token');
  });
});

describe('isAuthTokenExpired', () => {
  it('treats tokens inside the refresh window as expired', () => {
    expect(isAuthTokenExpired(200, 150)).toBe(true);
  });

  it('keeps tokens that are still outside the refresh window', () => {
    expect(isAuthTokenExpired(300, 150)).toBe(false);
  });
});

describe('refreshCognitoAuthToken', () => {
  it('refreshes an expired Cognito token and keeps the refresh token', async () => {
    const calls: RequestInit[] = [];
    const fetchFn = async (_url: Parameters<typeof fetch>[0], init?: RequestInit) => {
      if (init) calls.push(init);
      return new Response(
        JSON.stringify({
          id_token: 'new-id-token',
          access_token: 'new-access-token',
          expires_in: 3600,
        }),
        { status: 200 },
      );
    };

    const token = await refreshCognitoAuthToken(
      {
        authToken: 'old-id-token',
        authTokenExpiresAt: 100,
        refreshToken: 'refresh-token',
      },
      {
        clientId: 'client-123',
        issuer: 'https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_pool',
        nowSeconds: 200,
        fetchFn,
      },
    );

    expect(token.authToken).toBe('new-id-token');
    expect(token.authTokenExpiresAt).toBe(3800);
    expect(token.refreshToken).toBe('refresh-token');
    expect(calls[0]?.body?.toString()).toBe(
      'grant_type=refresh_token&client_id=client-123&refresh_token=refresh-token',
    );
  });
});

describe('authConfig jwt callback', () => {
  it('refreshes an expired account token before exposing the session token', async () => {
    const originalFetch = global.fetch;
    const originalCognitoId = process.env.AUTH_COGNITO_ID;
    const originalCognitoIssuer = process.env.AUTH_COGNITO_ISSUER;
    global.fetch = async () =>
      new Response(
        JSON.stringify({
          id_token: 'fresh-id-token',
          expires_in: 3600,
        }),
        { status: 200 },
      );
    process.env.AUTH_COGNITO_ID = 'client-123';
    process.env.AUTH_COGNITO_ISSUER = 'https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_pool';

    try {
      const jwt = authConfig.callbacks.jwt;
      const token = await jwt({
        token: {
          authToken: 'expired-id-token',
          authTokenExpiresAt: 100,
          refreshToken: 'refresh-token',
        },
        account: null,
        user: undefined,
      } as never);

      expect(token.authToken).toBe('fresh-id-token');
      expect(token.authTokenError).toBeUndefined();
    } finally {
      global.fetch = originalFetch;
      process.env.AUTH_COGNITO_ID = originalCognitoId;
      process.env.AUTH_COGNITO_ISSUER = originalCognitoIssuer;
    }
  });
});
