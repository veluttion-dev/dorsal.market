import { afterEach, describe, expect, it, vi } from 'vitest';

const originalEnv = { ...process.env };

function setRequiredEnv(overrides: Record<string, string | undefined> = {}) {
  process.env = {
    ...originalEnv,
    NODE_ENV: 'test',
    NEXTAUTH_SECRET: 'test-secret-at-least-16-chars',
    BACKEND_API_URL: 'http://localhost:8000',
    NEXT_PUBLIC_BACKEND_API_URL: 'http://localhost:8000',
    NEXT_PUBLIC_REAL_API_MODULES: 'dorsals,users,transactions',
    ...overrides,
  } as NodeJS.ProcessEnv;
}

describe('env', () => {
  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  it('treats blank optional feedback email config as absent', async () => {
    vi.resetModules();
    setRequiredEnv({
      RESEND_API_KEY: '',
      FEEDBACK_TO_EMAIL: '',
      FEEDBACK_FROM_EMAIL: '',
    });

    const { env } = await import('../env');

    expect(env.RESEND_API_KEY).toBeUndefined();
    expect(env.FEEDBACK_TO_EMAIL).toBeUndefined();
    expect(env.FEEDBACK_FROM_EMAIL).toBeUndefined();
  });
});
