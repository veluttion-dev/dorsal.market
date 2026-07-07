import { ApiError, NetworkError } from '@dorsal/api-client';
import { describe, expect, it } from 'vitest';
import { getTransactionErrorMessage, isDorsalUnavailableError } from '../errors';

describe('getTransactionErrorMessage', () => {
  it('maps network failures to a retryable backend message', () => {
    expect(getTransactionErrorMessage(new NetworkError())).toBe(
      'No se pudo conectar con el modulo de transacciones. Revisa que el backend este levantado o usa el modo mock.',
    );
  });

  it('includes backend detail string for bad reservation requests', () => {
    expect(
      getTransactionErrorMessage(
        new ApiError('HTTP 400', 400, { detail: 'Dorsal is not available' }),
      ),
    ).toBe('Dorsal is not available');
  });

  it('falls back to a generic message for unknown errors', () => {
    expect(getTransactionErrorMessage(new Error('boom'))).toBe(
      'No se pudo completar la operacion. Intentalo de nuevo en unos minutos.',
    );
  });

  it('detects unavailable dorsal reservation errors', () => {
    expect(
      isDorsalUnavailableError(
        new ApiError('HTTP 400', 400, { detail: 'Dorsal is not available (status: reserved)' }),
      ),
    ).toBe(true);
    expect(isDorsalUnavailableError(new ApiError('HTTP 409', 409, { detail: 'Conflict' }))).toBe(
      true,
    );
    expect(
      isDorsalUnavailableError(new ApiError('HTTP 422', 422, { detail: 'Invalid data' })),
    ).toBe(false);
  });
});
