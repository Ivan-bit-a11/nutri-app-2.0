import { fail, type ActionResult, ok } from "@/server/core/result"
import { toActionError } from "@/server/core/errors"

export async function runMutation<T>(handler: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await handler()
    return ok(data)
  } catch (error) {
    return fail(toActionError(error))
  }
}
