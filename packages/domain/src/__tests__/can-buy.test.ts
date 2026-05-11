import { describe, expect, it } from 'vitest';
import { canBuyDorsal } from '../can-buy';

describe('canBuyDorsal', () => {
  const userId = '550e8400-e29b-41d4-a716-446655440001';
  const sellerId = '550e8400-e29b-41d4-a716-446655440002';

  it('blocks buying own dorsal', () => {
    expect(canBuyDorsal({ userId: sellerId, sellerId, status: 'published' })).toEqual({
      ok: false,
      reason: 'own_dorsal',
    });
  });

  it('blocks buying non-published dorsal', () => {
    expect(canBuyDorsal({ userId, sellerId, status: 'sold' })).toEqual({
      ok: false,
      reason: 'not_available',
    });
    expect(canBuyDorsal({ userId, sellerId, status: 'draft' })).toEqual({
      ok: false,
      reason: 'not_available',
    });
  });

  it('blocks anonymous users', () => {
    expect(canBuyDorsal({ userId: null, sellerId, status: 'published' })).toEqual({
      ok: false,
      reason: 'not_authenticated',
    });
  });

  it('allows buying a published dorsal from another user', () => {
    expect(canBuyDorsal({ userId, sellerId, status: 'published' })).toEqual({ ok: true });
  });
});
