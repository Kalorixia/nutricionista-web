interface SessionTokens {
  accessToken: string
  refreshToken: string
}

let tokens: SessionTokens | null = null
let refreshHandler: (() => Promise<void>) | null = null
let refreshPromise: Promise<boolean> | null = null

export function setSessionTokens(next: SessionTokens | null) {
  tokens = next
}

export function getSessionToken(): string | null {
  return tokens?.accessToken ?? null
}

export function setRefreshHandler(handler: (() => Promise<void>) | null) {
  refreshHandler = handler
}

/**
 * Refreshes the session at most once for any number of concurrent callers —
 * callers that arrive while a refresh is already in flight await the same
 * promise instead of triggering their own, since Supabase rotates refresh
 * tokens (a second concurrent refresh would invalidate the first).
 */
export function refreshSessionOnce(): Promise<boolean> {
  if (!refreshHandler) return Promise.resolve(false)
  if (!refreshPromise) {
    const handler = refreshHandler
    refreshPromise = handler()
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}
