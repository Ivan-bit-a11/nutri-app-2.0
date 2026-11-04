import type { ActionError } from "@/server/core/errors"

export interface ActionSuccess<T> {
  success: true
  data: T
}

export interface ActionFailure {
  success: false
  error: ActionError
}

export type ActionResult<T = void> = ActionSuccess<T> | ActionFailure

export function ok<T>(data: T): ActionSuccess<T> {
  return { success: true, data }
}

export function fail(error: ActionError): ActionFailure {
  return { success: false, error }
}
