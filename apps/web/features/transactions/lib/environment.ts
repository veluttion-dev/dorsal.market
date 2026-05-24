export function isTransactionsMocked(realModules = process.env.NEXT_PUBLIC_REAL_API_MODULES ?? '') {
  return !realModules
    .split(',')
    .map((part) => part.trim())
    .includes('transactions');
}
