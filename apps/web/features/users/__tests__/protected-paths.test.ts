import { isProtectedPath } from '@/auth.config';
import { describe, expect, it } from 'vitest';

describe('isProtectedPath', () => {
  it('keeps dorsal browsing public', () => {
    expect(isProtectedPath('/dorsales')).toBe(false);
    expect(isProtectedPath('/dorsales/550e8400-e29b-41d4-a716-446655440010')).toBe(false);
  });

  it('protects private purchase, selling and profile workflows', () => {
    expect(isProtectedPath('/compra/checkout/550e8400-e29b-41d4-a716-446655440010')).toBe(true);
    expect(isProtectedPath('/perfil')).toBe(true);
    expect(isProtectedPath('/perfil/completar')).toBe(true);
    expect(isProtectedPath('/vender')).toBe(true);
    expect(isProtectedPath('/vender/onboarding')).toBe(true);
  });
});
