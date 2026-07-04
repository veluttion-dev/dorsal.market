type CognitoLogoutInput = {
  domain: string;
  issuer: string;
  clientId: string;
  logoutUri: string;
};

function getRegionFromIssuer(issuer: string) {
  const host = new URL(issuer).hostname;
  const match = /^cognito-idp\.([a-z0-9-]+)\.amazonaws\.com$/.exec(host);
  return match?.[1] ?? null;
}

function getHostedUiOrigin(domain: string, issuer: string) {
  const trimmedDomain = domain.trim().replace(/\/+$/, '');
  if (!trimmedDomain) return null;

  if (trimmedDomain.startsWith('https://') || trimmedDomain.startsWith('http://')) {
    return trimmedDomain;
  }

  if (trimmedDomain.includes('.')) {
    return `https://${trimmedDomain}`;
  }

  const region = getRegionFromIssuer(issuer);
  if (!region) return null;
  return `https://${trimmedDomain}.auth.${region}.amazoncognito.com`;
}

export function safeSameOriginReturnTo(returnTo: string | null, origin: string) {
  const fallback = new URL('/', origin);
  if (!returnTo) return fallback.toString();

  const target = new URL(returnTo, origin);
  if (target.origin !== origin) return fallback.toString();
  return target.toString();
}

export function buildCognitoLogoutUrl({ domain, issuer, clientId, logoutUri }: CognitoLogoutInput) {
  const hostedUiOrigin = getHostedUiOrigin(domain, issuer);
  if (!hostedUiOrigin) return null;

  const url = new URL('/logout', hostedUiOrigin);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('logout_uri', logoutUri);
  return url.toString();
}

export function buildLocalCognitoLogoutPath(returnTo = '/') {
  return `/api/auth/cognito/logout?returnTo=${encodeURIComponent(returnTo)}`;
}
