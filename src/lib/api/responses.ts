export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "INTERNAL_ERROR"
  | "BAD_GATEWAY"

export interface ApiSuccessBody<T> {
  ok: true
  data: T
}

export interface ApiErrorBody {
  ok: false
  error: {
    code: ApiErrorCode
    message: string
    details?: unknown
  }
}

export function createSuccessBody<T>(data: T): ApiSuccessBody<T> {
  return { ok: true, data }
}

export function createErrorBody(
  code: ApiErrorCode,
  message: string,
  details?: unknown
): ApiErrorBody {
  return {
    ok: false,
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
  }
}
