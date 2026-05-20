import type { Page } from '@playwright/test';
import { encode } from 'next-auth/jwt';

const SESSION_COOKIE = 'authjs.session-token';
const SEED_USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const E2E_AUTH_SECRET = process.env.NEXTAUTH_SECRET ?? 'e2e-auth-secret-at-least-16-chars';

export async function signInAsDemoUser(page: Page) {
  const token = await encode({
    secret: E2E_AUTH_SECRET,
    salt: SESSION_COOKIE,
    token: {
      sub: SEED_USER_ID,
      userId: SEED_USER_ID,
      name: 'Carlos Martinez',
      email: 'demo@dorsal.market',
    },
  });

  await page.context().addCookies([
    {
      name: SESSION_COOKIE,
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      secure: false,
      expires: Math.floor(Date.now() / 1000) + 60 * 60,
    },
  ]);
}
