import { selectAccountAuthToken } from '@/auth.config';
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
