export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "DATABASE_ERROR"
  | "INTERNAL_ERROR"

export interface ActionError {
  code: ErrorCode
  message: string
  details?: unknown
}

export class AppError extends Error {
  code: ErrorCode
  status: number
  details?: unknown

  constructor(code: ErrorCode, message: string, status: number, details?: unknown) {
    super(message)
    this.name = "AppError"
    this.code = code
    this.status = status
    this.details = details
  }
}

export function toActionError(error: unknown): ActionError {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
    }
  }

  if (error instanceof Error) {
    return {
      code: "INTERNAL_ERROR",
      message: error.message || "Unexpected error",
    }
  }

  return {
    code: "INTERNAL_ERROR",
    message: "Unexpected error",
  }
}

export function unauthorized(message = "Authentication required") {
  return new AppError("UNAUTHORIZED", message, 401)
}

export function forbidden(message = "You do not have access to this resource") {
  return new AppError("FORBIDDEN", message, 403)
}

export function notFound(message = "Resource not found") {
  return new AppError("NOT_FOUND", message, 404)
}

export function validationError(message: string, details?: unknown) {
  return new AppError("VALIDATION_ERROR", message, 400, details)
}

export function conflict(message: string, details?: unknown) {
  return new AppError("CONFLICT", message, 409, details)
}

export function databaseError(message: string, details?: unknown) {
  return new AppError("DATABASE_ERROR", message, 500, details)
}
