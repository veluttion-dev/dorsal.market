import { describe, expect, it } from 'vitest';
import { buildMockAuthToken, sessionAuthToken } from '../lib/mock-auth-token';

describe('mock auth token helpers', () => {
  it('builds a reconstructable mock bearer token while users are mocked', () => {
    expect(
      buildMockAuthToken({
        id: '550e8400-e29b-41d4-a716-446655440099',
        email: 'ana@example.com',
        name: 'Ana Garcia',
      }),
    ).toBe('mock:550e8400-e29b-41d4-a716-446655440099:ana%40example.com:Ana%20Garcia');
  });

  it('prefers the provider token when Auth.js exposes one', () => {
    expect(
      sessionAuthToken({
        id: '550e8400-e29b-41d4-a716-446655440099',
        email: 'ana@example.com',
        name: 'Ana Garcia',
        token: 'jwt-token',
      }),
    ).toBe('jwt-token');
  });

  it('does not synthesize mock tokens when users are real', () => {
    expect(
      buildMockAuthToken(
        {
          id: '550e8400-e29b-41d4-a716-446655440099',
          email: 'ana@example.com',
          name: 'Ana Garcia',
        },
        'users',
      ),
    ).toBeNull();
  });
});
