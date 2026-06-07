export function isUsersMocked(realModules = process.env.NEXT_PUBLIC_REAL_API_MODULES ?? '') {
  return !realModules
    .split(',')
    .map((module) => module.trim())
    .filter(Boolean)
    .includes('users');
}
