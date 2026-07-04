import { afterEach, describe, expect, it } from 'vitest';
import { GET } from '../route';

const originalEnv = { ...process.env };

describe('GET /api/auth/cognito/logout', () => {
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('redirects to Cognito Hosted UI logout when configured', async () => {
    process.env.AUTH_COGNITO_DOMAIN = 'dorsales-pre';
    process.env.AUTH_COGNITO_ID = 'client-123';
    process.env.AUTH_COGNITO_ISSUER =
      'https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_lwL5qYgyF';

    const response = await GET(
      new Request('http://localhost:3000/api/auth/cognito/logout?returnTo=%2F'),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://dorsales-pre.auth.eu-west-1.amazoncognito.com/logout?client_id=client-123&logout_uri=http%3A%2F%2Flocalhost%3A3000%2F',
    );
  });

  it('falls back to the local return target when Cognito logout is not configured', async () => {
    Reflect.deleteProperty(process.env, 'AUTH_COGNITO_DOMAIN');
    process.env.AUTH_COGNITO_ID = 'client-123';
    process.env.AUTH_COGNITO_ISSUER =
      'https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_lwL5qYgyF';

    const response = await GET(
      new Request('http://localhost:3000/api/auth/cognito/logout?returnTo=%2Flogin'),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/login');
  });
});
