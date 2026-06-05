import { describe, expect, it } from 'vitest';
import { isUsersMocked } from '../lib/auth-mode';

describe('auth mode helpers', () => {
  it('detects mocked users when users is absent from real modules', () => {
    expect(isUsersMocked('dorsals,transactions')).toBe(true);
  });

  it('detects real users when users is present in real modules', () => {
    expect(isUsersMocked('dorsals, users, transactions')).toBe(false);
  });

  it('treats empty real modules as mocked', () => {
    expect(isUsersMocked('')).toBe(true);
  });
});
