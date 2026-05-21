import type { Page } from '@playwright/test';
import { encode } from 'next-auth/jwt';

const SESSION_COOKIE = 'authjs.session-token';
const SEED_USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const E2E_AUTH_SECRET = process.env.NEXTAUTH_SECRET ?? 'e2e-auth-secret-at-least-16-chars';

interface SignInOptions {
  userId?: string;
  name?: string;
  email?: string;
  authToken?: string;
}

export async function signInAsDemoUser(page: Page, options: SignInOptions = {}) {
  const userId = options.userId ?? SEED_USER_ID;
  const payload = {
    sub: userId,
    userId,
    name: options.name ?? 'Carlos Martinez',
    email: options.email ?? 'demo@dorsal.market',
    ...(options.authToken ? { authToken: options.authToken } : {}),
  };

  const sessionToken = await encode({
    secret: E2E_AUTH_SECRET,
    salt: SESSION_COOKIE,
    token: payload,
  });

  await page.context().addCookies([
    {
      name: SESSION_COOKIE,
      value: sessionToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      secure: false,
      expires: Math.floor(Date.now() / 1000) + 60 * 60,
    },
  ]);
}
