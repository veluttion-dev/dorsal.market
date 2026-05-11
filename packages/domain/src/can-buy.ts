import type { DorsalStatus } from '@dorsal/schemas';

export type CanBuyInput = {
  userId: string | null;
  sellerId: string;
  status: DorsalStatus;
};

export type CanBuyResult =
  | { ok: true }
  | { ok: false; reason: 'own_dorsal' | 'not_available' | 'not_authenticated' };

export function canBuyDorsal({ userId, sellerId, status }: CanBuyInput): CanBuyResult {
  if (!userId) return { ok: false, reason: 'not_authenticated' };
  if (userId === sellerId) return { ok: false, reason: 'own_dorsal' };
  if (status !== 'published') return { ok: false, reason: 'not_available' };
  return { ok: true };
}
