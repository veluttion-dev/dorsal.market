import { describe, expect, it } from 'vitest';
import { buildCognitoLogoutUrl, safeSameOriginReturnTo } from '../cognito-logout';

describe('buildCognitoLogoutUrl', () => {
  it('builds the Hosted UI logout URL from a Cognito domain prefix', () => {
    const url = buildCognitoLogoutUrl({
      domain: 'dorsales-pre',
      issuer: 'https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_lwL5qYgyF',
      clientId: 'client-123',
      logoutUri: 'http://localhost:3000/',
    });

    expect(url).toBe(
      'https://dorsales-pre.auth.eu-west-1.amazoncognito.com/logout?client_id=client-123&logout_uri=http%3A%2F%2Flocalhost%3A3000%2F',
    );
  });

  it('keeps return targets on the current origin', () => {
    expect(safeSameOriginReturnTo('http://evil.example/login', 'http://localhost:3000')).toBe(
      'http://localhost:3000/',
    );
    expect(safeSameOriginReturnTo('/login?callbackUrl=%2Fperfil', 'http://localhost:3000')).toBe(
      'http://localhost:3000/login?callbackUrl=%2Fperfil',
    );
  });
});
