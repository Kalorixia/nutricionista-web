import { getSessionToken, refreshSessionOnce } from "@/services/session"

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api/v1"

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown
  token?: string
}

export async function apiFetch<T>(
  path: string,
  { body, token, headers, ...rest }: ApiFetchOptions = {}
): Promise<T> {
  const isFormData = body instanceof FormData
  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: isFormData
      ? body
      : body !== undefined
        ? JSON.stringify(body)
        : undefined,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const detail =
      (data && typeof data === "object" && "detail" in data
        ? String((data as { detail: unknown }).detail)
        : null) ?? "Ocurrió un error inesperado"
    throw new ApiError(detail, response.status)
  }

  return data as T
}

/**
 * Authenticated request helper: attaches the current session token and
 * retries once after a single silent refresh if the backend responds 401.
 */
export async function authedFetch<T>(
  path: string,
  opts: Omit<ApiFetchOptions, "token"> = {}
): Promise<T> {
  const token = getSessionToken()
  if (!token) throw new ApiError("No hay sesión activa", 401)

  try {
    return await apiFetch<T>(path, { ...opts, token })
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error
    }
    const refreshed = await refreshSessionOnce()
    const freshToken = getSessionToken()
    if (!refreshed || !freshToken) {
      throw error
    }
    return apiFetch<T>(path, { ...opts, token: freshToken })
  }
}
