import { describe, expect, it } from 'vitest';
import { buildCognitoProviderConfig } from '../cognito-provider-config';

describe('buildCognitoProviderConfig', () => {
  it('uses public-client token auth when Cognito has no client secret', () => {
    expect(
      buildCognitoProviderConfig({
        clientId: 'client-id',
        issuer: 'https://cognito-idp.eu-west-1.amazonaws.com/pool-id',
        clientSecret: undefined,
      }),
    ).toEqual({
      clientId: 'client-id',
      issuer: 'https://cognito-idp.eu-west-1.amazonaws.com/pool-id',
      client: { token_endpoint_auth_method: 'none' },
    });
  });

  it('uses the client secret when Cognito has one', () => {
    expect(
      buildCognitoProviderConfig({
        clientId: 'client-id',
        issuer: 'https://cognito-idp.eu-west-1.amazonaws.com/pool-id',
        clientSecret: 'secret',
      }),
    ).toEqual({
      clientId: 'client-id',
      clientSecret: 'secret',
      issuer: 'https://cognito-idp.eu-west-1.amazonaws.com/pool-id',
    });
  });
});
