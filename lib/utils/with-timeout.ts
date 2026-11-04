export class OperationTimeoutError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "OperationTimeoutError"
  }
}

export async function withTimeout<T>(
  promise: PromiseLike<T>,
  timeoutMs: number,
  operationLabel: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new OperationTimeoutError(`${operationLabel} timed out after ${timeoutMs}ms`))
    }, timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}
