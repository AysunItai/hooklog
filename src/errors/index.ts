export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, message, 'VALIDATION_ERROR', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, message, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(404, message, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(409, message, 'CONFLICT', details);
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message: string = 'Request payload too large') {
    super(413, message, 'PAYLOAD_TOO_LARGE');
  }
}

export class TimeoutError extends AppError {
  constructor(message: string = 'Request timeout') {
    super(408, message, 'TIMEOUT');
  }
}

export class SSRFError extends AppError {
  constructor(message: string = 'SSRF protection: target URL not allowed') {
    super(400, message, 'SSRF_PROTECTION');
  }
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}
