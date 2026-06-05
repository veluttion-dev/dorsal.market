import { describe, expect, it } from 'vitest';
import { bearerIdentity, currentUserId } from '../msw/identity';

function jwt(payload: Record<string, unknown>) {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'none' })}.${encode(payload)}.signature`;
}

describe('msw identity helpers', () => {
  it('extracts a reconstructable identity from a Cognito-like bearer token', () => {
    const request = new Request('https://api.test/api/v1/me', {
      headers: {
        authorization: `Bearer ${jwt({
          sub: '550e8400-e29b-41d4-a716-446655440099',
          email: 'ana@example.com',
          name: 'Ana Garcia',
        })}`,
      },
    });

    expect(bearerIdentity(request)).toEqual({
      id: '550e8400-e29b-41d4-a716-446655440099',
      email: 'ana@example.com',
      name: 'Ana Garcia',
    });
    expect(currentUserId(request)).toBe('550e8400-e29b-41d4-a716-446655440099');
  });

  it('keeps supporting explicit local mock bearer tokens', () => {
    const request = new Request('https://api.test/api/v1/me', {
      headers: {
        authorization:
          'Bearer mock:550e8400-e29b-41d4-a716-446655440099:ana%40example.com:Ana%20Garcia',
      },
    });

    expect(bearerIdentity(request)?.email).toBe('ana@example.com');
  });
});
