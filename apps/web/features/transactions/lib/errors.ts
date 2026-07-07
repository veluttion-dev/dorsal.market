import { ApiError, NetworkError } from '@dorsal/api-client';

function detailToMessage(detail: unknown): string | null {
  if (typeof detail === 'string') return detail;
  if (detail && typeof detail === 'object' && 'detail' in detail) {
    const value = (detail as { detail?: unknown }).detail;
    if (typeof value === 'string') return value;
  }
  return null;
}

export function getTransactionErrorMessage(error: unknown) {
  if (error instanceof NetworkError) {
    return 'No se pudo conectar con el modulo de transacciones. Revisa que el backend este levantado o usa el modo mock.';
  }
  if (error instanceof ApiError) {
    return detailToMessage(error.detail) ?? `El backend rechazo la operacion (${error.status}).`;
  }
  return 'No se pudo completar la operacion. Intentalo de nuevo en unos minutos.';
}

export function isDorsalUnavailableError(error: unknown) {
  if (!(error instanceof ApiError)) return false;

  const detail = detailToMessage(error.detail)?.toLowerCase() ?? '';
  return (
    error.status === 409 ||
    detail.includes('not available') ||
    detail.includes('reserved') ||
    detail.includes('reservado')
  );
}
