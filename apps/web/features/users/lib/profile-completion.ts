import type { UserProfile } from '@dorsal/schemas';

export function canBuyWithProfile(user: UserProfile | null | undefined) {
  return Boolean(user?.profile_complete);
}

export function getMissingProfileFields(user: UserProfile | null | undefined) {
  if (!user) return [];

  const missing: string[] = [];
  if (!user.profile_complete) missing.unshift('Datos de identidad');
  return missing;
}
