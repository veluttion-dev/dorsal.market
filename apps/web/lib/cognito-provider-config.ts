import type { OAuthUserConfig } from 'next-auth/providers';
import type { CognitoProfile } from 'next-auth/providers/cognito';

type CognitoConfigInput = {
  clientId: string;
  issuer: string;
  clientSecret?: string | undefined;
};

export function buildCognitoProviderConfig({
  clientId,
  issuer,
  clientSecret,
}: CognitoConfigInput): OAuthUserConfig<CognitoProfile> {
  if (clientSecret) {
    return { clientId, clientSecret, issuer };
  }

  return {
    clientId,
    issuer,
    client: { token_endpoint_auth_method: 'none' },
  };
}
