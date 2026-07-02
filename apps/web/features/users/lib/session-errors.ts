import { ApiError, UnauthorizedError } from '@dorsal/api-client';

export const SESSION_EXPIRED_MESSAGE =
  'Tu sesion ha caducado. Vuelve a iniciar sesion para continuar.';

export function isSessionAuthError(error: unknown) {
  return error instanceof UnauthorizedError || (error instanceof ApiError && error.status === 401);
}
