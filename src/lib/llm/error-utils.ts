import { APICallError } from "ai"

export function isRetryableLlmError(error: unknown): boolean {
  if (APICallError.isInstance(error)) {
    return error.isRetryable === true
  }

  if (error instanceof Error && APICallError.isInstance(error.cause)) {
    return error.cause.isRetryable === true
  }

  return false
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return "Unknown error"
}
