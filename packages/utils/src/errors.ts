import type { ApiResponse } from '@assessment/types';

export enum ErrorCode {
  // Auth
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_REFRESH_TOKEN = 'INVALID_REFRESH_TOKEN',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',

  // Resource
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',

  // Exam
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_ALREADY_SUBMITTED = 'SESSION_ALREADY_SUBMITTED',
  SESSION_NOT_SUBMITTED = 'SESSION_NOT_SUBMITTED',
  PAPER_NOT_PURCHASED = 'PAPER_NOT_PURCHASED',

  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function createErrorResponse(
  code: string,
  message: string,
  details?: unknown,
): ApiResponse {
  return {
    success: false,
    error: { code, message, details },
  };
}

export function createSuccessResponse<T>(data: T, meta?: ApiResponse['meta']): ApiResponse<T> {
  return {
    success: true,
    data,
    meta,
  };
}
