/**
 * In-memory access token store.
 *
 * WHY: localStorage is readable by any JavaScript on the page (XSS risk).
 * The access token lives here — in a plain module-level variable — so it is
 * never written to any persistent storage. On page reload the token is gone
 * and useSession restores it silently via the HttpOnly refresh token cookie.
 *
 * The refresh token is NOT handled here — it lives in an HttpOnly cookie
 * managed entirely by the browser and the backend Set-Cookie header.
 */

let inMemoryToken: string | null = null;

export function setAccessToken(token: string | null): void {
  inMemoryToken = token;
}

export function getAccessToken(): string | null {
  return inMemoryToken;
}
