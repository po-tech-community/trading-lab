/**
 * Custom API Error to handle HTTP status codes and API error responses.
 */
export class ApiError extends Error {
  public status: number;
  public data: Record<string, unknown> | undefined;

  constructor(status: number, message: string, data?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = "ApiError";
  }
}

import { env } from "./env";
import { getAccessToken, setAccessToken } from "./auth-token";

// ── Token refresh singleton ───────────────────────────────────────────────────

/**
 * Tracks an in-flight /auth/refresh call.
 *
 * WHY: If 3 requests all fail with 401 at the same time (e.g. on page load),
 * we must not fire 3 separate refresh calls — the second and third would fail
 * because the first already rotated the refresh token cookie.
 * All concurrent callers wait for the SAME promise to resolve.
 */
let pendingRefresh: Promise<string | null> | null = null;

/**
 * Calls /auth/refresh using raw fetch (NOT apiClient, to avoid infinite loops).
 * On success, writes the new access token to memory and returns it.
 * On failure, returns null.
 */
async function tryRefreshAccessToken(): Promise<string | null> {
  if (pendingRefresh) return pendingRefresh;

  pendingRefresh = fetch(`${env.apiUrl}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
  })
    .then(async (res) => {
      if (!res.ok) return null;
      const data = (await res.json()) as { accessToken: string };
      setAccessToken(data.accessToken);
      return data.accessToken;
    })
    .catch(() => null)
    .finally(() => {
      pendingRefresh = null;
    });

  return pendingRefresh;
}

/**
 * Called when the refresh token itself is expired or revoked.
 * Clears the in-memory session and redirects to the login page.
 */
function handleSessionExpired(): void {
  setAccessToken(null);
  localStorage.removeItem("user");
  window.location.href = "/log-in";
}

// ── API client ────────────────────────────────────────────────────────────────

/**
 * A reusable API abstraction using the native fetch API.
 *
 * 401 handling:
 *   1. Intercept the 401 response.
 *   2. Call /auth/refresh once (via tryRefreshAccessToken).
 *   3. If refresh succeeds → retry the original request with the new token.
 *   4. If refresh fails    → clear session + redirect to /log-in.
 *
 * The `isRetry` flag prevents infinite loops: a retried request that gets
 * another 401 is not retried again.
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
  { isRetry = false }: { isRetry?: boolean } = {},
): Promise<T> {
  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // Read the access token from memory (never localStorage — see auth-token.ts).
  const token = getAccessToken();
  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  const config: RequestInit = {
    ...options,
    signal: options.signal ?? controller.signal,
    credentials: options.credentials ?? "include",
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  let response: Response;
  try {
    response = await fetch(`${env.apiUrl}${endpoint}`, config);
  } finally {
    clearTimeout(timeoutId);
  }

  // ── 401: attempt a silent token refresh, then retry once ─────────────────
  if (response.status === 401 && !isRetry) {
    const newToken = await tryRefreshAccessToken();

    if (newToken) {
      // Fresh token is now in memory; retry the original request.
      return apiClient<T>(endpoint, options, { isRetry: true });
    }

    // Refresh token is also expired or revoked — force re-login.
    handleSessionExpired();
    throw new ApiError(401, "Session expired. Please log in again.");
  }

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    throw new ApiError(
      response.status,
      errorData.message || "API Request Failed",
      errorData,
    );
  }

  // Handle No Content response
  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();

  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}
