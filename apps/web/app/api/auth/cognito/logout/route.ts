import { buildCognitoLogoutUrl, safeSameOriginReturnTo } from '@/lib/cognito-logout';
import { NextResponse } from 'next/server';

function optionalEnv(value: string | undefined) {
  return value?.trim() ? value : undefined;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const returnTo = safeSameOriginReturnTo(
    requestUrl.searchParams.get('returnTo'),
    requestUrl.origin,
  );

  const domain = optionalEnv(process.env.AUTH_COGNITO_DOMAIN);
  const clientId = optionalEnv(process.env.AUTH_COGNITO_ID);
  const issuer = optionalEnv(process.env.AUTH_COGNITO_ISSUER);

  if (!domain || !clientId || !issuer) {
    return NextResponse.redirect(returnTo);
  }

  const logoutUrl = buildCognitoLogoutUrl({
    domain,
    issuer,
    clientId,
    logoutUri: returnTo,
  });

  return NextResponse.redirect(logoutUrl ?? returnTo);
}
