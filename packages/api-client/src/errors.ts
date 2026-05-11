export class ApiError extends Error {
  readonly status: number;
  readonly detail?: unknown;
  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

export class UnauthorizedError extends ApiError {
  constructor(detail?: unknown) {
    super('Unauthorized', 401, detail);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(detail?: unknown) {
    super('Forbidden', 403, detail);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ApiError {
  constructor(detail?: unknown) {
    super('Not found', 404, detail);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends ApiError {
  constructor(detail?: unknown) {
    super('Validation', 422, detail);
    this.name = 'ValidationError';
  }
}

export class ServerError extends ApiError {
  constructor(status = 500, detail?: unknown) {
    super('Server', status, detail);
    this.name = 'ServerError';
  }
}

export class NetworkError extends Error {
  constructor(cause?: unknown) {
    super('Network');
    this.cause = cause;
    this.name = 'NetworkError';
  }
}

export function fromHttpStatus(status: number, detail?: unknown): ApiError {
  if (status === 401) return new UnauthorizedError(detail);
  if (status === 403) return new ForbiddenError(detail);
  if (status === 404) return new NotFoundError(detail);
  if (status === 422) return new ValidationError(detail);
  if (status >= 500) return new ServerError(status, detail);
  return new ApiError(`HTTP ${status}`, status, detail);
}
