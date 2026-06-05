interface BearerIdentity {
  id: string;
  email: string | null;
  name: string | null;
}

function decodeBase64UrlJson(segment: string) {
  try {
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const json =
      typeof atob === 'function' ? atob(padded) : Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function jwtIdentity(token: string): BearerIdentity | null {
  const [, payloadSegment] = token.split('.');
  if (!payloadSegment) return null;
  const payload = decodeBase64UrlJson(payloadSegment);
  const id = payload?.sub;
  if (typeof id !== 'string' || !id) return null;
  const email = typeof payload.email === 'string' ? payload.email : null;
  const name =
    typeof payload.name === 'string'
      ? payload.name
      : typeof payload['cognito:username'] === 'string'
        ? payload['cognito:username']
        : null;
  return { id, email: email ?? `${id}@cognito.local`, name };
}

function localMockIdentity(token: string): BearerIdentity | null {
  if (!token.startsWith('mock:')) return null;
  const [, id, email, name] = token.match(/^mock:([^:]+)(?::([^:]+))?(?::(.+))?$/) ?? [];
  if (!id) return null;
  return {
    id,
    email: email ? decodeURIComponent(email) : null,
    name: name ? decodeURIComponent(name) : null,
  };
}

export function bearerIdentity(request: Request): BearerIdentity | null {
  const bearer = request.headers.get('authorization');
  if (!bearer?.startsWith('Bearer ')) return null;
  const token = bearer.slice('Bearer '.length).trim();
  return localMockIdentity(token) ?? jwtIdentity(token);
}

export function currentUserId(request: Request, fallback?: string) {
  return bearerIdentity(request)?.id ?? request.headers.get('x-user-id') ?? fallback ?? null;
}
