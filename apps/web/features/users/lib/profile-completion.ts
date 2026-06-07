import type { UserProfile } from '@dorsal/schemas';

const REQUIRED_RUNNER_FIELDS = [
  ['estimated_time', 'Tiempo estimado'],
  ['t_shirt_size', 'Talla de camiseta'],
  ['emergency_contact', 'Contacto de emergencia'],
] as const satisfies ReadonlyArray<readonly [keyof UserProfile, string]>;

export function canBuyWithProfile(user: UserProfile | null | undefined) {
  return Boolean(user?.profile_complete && user.runner_data_complete);
}

export function getMissingProfileFields(user: UserProfile | null | undefined) {
  if (!user) return [];

  const missing: string[] = REQUIRED_RUNNER_FIELDS.flatMap(([field, label]) =>
    user[field] ? [] : [label],
  );
  if (!user.profile_complete) missing.unshift('Datos de identidad');
  return missing;
}
