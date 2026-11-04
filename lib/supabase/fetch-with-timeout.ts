const DEFAULT_SUPABASE_FETCH_TIMEOUT_MS = 8000

export class SupabaseTimeoutError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SupabaseTimeoutError"
  }
}

export function createSupabaseFetchWithTimeout(timeoutMs = DEFAULT_SUPABASE_FETCH_TIMEOUT_MS): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      return await fetch(input, {
        ...init,
        signal: init?.signal ?? controller.signal,
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new SupabaseTimeoutError(`Supabase request timed out after ${timeoutMs}ms`)
      }
      throw error
    } finally {
      clearTimeout(timeout)
    }
  }
}
