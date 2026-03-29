# OAuth Implementation Process (Google)

This document explains how Google OAuth is implemented in Trading Lab, from user click to authenticated session. 
---

## 1. Goal

The purpose of OAuth in this project is to let users sign in with their Google account without entering a password manually.

At the end of the flow:

- The user is authenticated in Trading Lab.
- The backend creates or links a local user record.
- The backend returns a short-lived access token.
- The backend stores a refresh token in an HTTP-only cookie.
- The frontend restores the session and redirects the user into the app.

---

## 2. Main Flow Overview

The Google OAuth flow in this project works like this:

1. The user clicks "Continue with Google" on the frontend.
2. The frontend sends the browser to `GET /auth/google?redirect=frontend`.
3. The backend builds a Google authorization URL and redirects the browser to Google.
4. The user signs in and approves access on Google.
5. Google redirects back to the backend callback route: `GET /auth/google/callback`.
6. The backend exchanges the authorization `code` for Google tokens.
7. The backend fetches the Google profile.
8. The backend finds, links, or creates a local Trading Lab user.
9. The backend issues:
   - an access token in the response flow
   - a refresh token in an HTTP-only cookie
10. The backend redirects the browser to the frontend callback page.
11. The frontend callback page calls `POST /auth/refresh`.
12. The backend reads the refresh cookie and returns a fresh access token plus the current user.
13. The frontend stores the session locally and navigates to `/home`.

---

## 3. Frontend Entry Point

The frontend starts Google OAuth in:

- `front-end/src/hooks/use-auth.ts`

Relevant function:

```ts
export function beginGoogleAuth() {
  const apiBaseUrl =
    import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
  window.location.href = `${apiBaseUrl}/auth/google?redirect=frontend`;
}
```

### What this does

- Reads the backend base URL from `VITE_API_URL`.
- Redirects the entire browser to the backend OAuth entry route.
- Uses `redirect=frontend` so the backend knows it should send the user back to the frontend callback page after Google login completes.

---

## 4. Backend OAuth Entry Route

The backend OAuth entry route is in:

- `back-end/src/auth/auth.controller.ts`

Route:

```ts
@Get('google')
googleAuth(
  @Query('redirect') redirect: string | undefined,
  @Res() res: Response,
) {
  return res.redirect(
    this.authService.getGoogleAuthUrl(redirect === 'frontend'),
  );
}
```

### What this route does

- Receives the incoming browser request from the frontend.
- Calls `AuthService.getGoogleAuthUrl(...)`.
- Redirects the browser to Google's consent screen.

---

## 5. Building the Google Authorization URL

The Google authorization URL is built in:

- `back-end/src/auth/auth.service.ts`

Method:

```ts
getGoogleAuthUrl(redirectToFrontend = false): string
```

### Parameters included

The backend sends Google these important values:

- `client_id`
- `redirect_uri`
- `response_type=code`
- `scope=openid email profile`
- `access_type=offline`
- `prompt=consent`

### Why these matter

- `response_type=code`: Uses the secure authorization-code flow.
- `scope=openid email profile`: Lets the app read Google identity basics.
- `access_type=offline`: Helps Google return credentials suitable for longer-lived sessions.
- `prompt=consent`: Forces the consent step when needed so the flow stays predictable during development.

### Frontend redirect state

If `redirect=frontend` was requested, the backend stores the frontend callback URL in the `state` parameter.

That lets the backend validate where it is allowed to redirect after Google finishes authentication.

---

## 6. Backend Callback Route

The callback route is also in:

- `back-end/src/auth/auth.controller.ts`

Route:

```ts
@Get('google/callback')
async googleCallback(
  @Query('code') code: string,
  @Query('state') state: string | undefined,
  @Res({ passthrough: true }) res: Response,
)
```

### What this route does

1. Receives the `code` from Google.
2. Calls `authService.loginWithGoogle(code)`.
3. Stores the refresh token in a cookie.
4. Validates the `state` value if a frontend redirect was requested.
5. Redirects the browser to the frontend callback page.

If no frontend redirect is used, the backend can return JSON directly instead.

---

## 7. Exchanging the Google Code for Tokens

Inside `AuthService.loginWithGoogle(code)`, the backend:

1. Validates that `code` exists.
2. Calls `exchangeGoogleCodeForTokens(code)`.
3. Sends a `POST` request to:

```text
https://oauth2.googleapis.com/token
```

4. Includes:
   - `code`
   - `client_id`
   - `client_secret`
   - `redirect_uri`
   - `grant_type=authorization_code`

### Result

Google returns an access token that the backend can use to request the user's profile.

---

## 8. Fetching the Google Profile

After token exchange, the backend calls:

```text
https://www.googleapis.com/oauth2/v3/userinfo
```

This is done in:

- `AuthService.fetchGoogleProfile(accessToken)`

### The backend checks

- The Google profile has an email.
- The email is verified.

If either check fails, the backend rejects the login.

---

## 9. Linking or Creating a Local User

After receiving the Google profile, Trading Lab must map that Google account to a local user in its own database.

This logic is in:

- `back-end/src/auth/auth.service.ts`
- `back-end/src/users/users.service.ts`

### The decision flow

1. Try to find a user by `googleId`.
2. If not found, try to find a user by email.
3. If a user with the same email already exists:
   - link the Google account to that local user
4. If no user exists:
   - create a new user
   - store `googleId`
   - store `avatarUrl` if available
   - generate a random password hash internally

### Why we still create a local user

OAuth proves identity with Google, but Trading Lab still needs its own user record for:

- profile data
- ownership of resources
- audit logs
- future app features

---

## 10. Issuing Trading Lab Tokens

Once the local user is ready, the backend issues:

- an access token
- a refresh token

These are generated by:

- `signAccessToken(...)`
- `signRefreshToken(...)`
- `issueAuthTokens(...)`

### Token responsibilities

- Access token:
  - short-lived
  - used for authenticated API requests
- Refresh token:
  - longer-lived
  - stored in a cookie
  - used to restore or renew the session

---

## 11. Refresh Token Cookie

The backend stores the refresh token using `setRefreshTokenCookie(...)` in:

- `back-end/src/auth/auth.controller.ts`

Current cookie settings:

- `httpOnly: true`
- `sameSite: 'lax'`
- `secure: false`
- `maxAge: REFRESH_TOKEN_MAX_AGE`

### Why this matters

- `httpOnly: true`: frontend JavaScript cannot read the refresh token directly.
- `sameSite: 'lax'`: helps reduce some cross-site request risks.
- `secure: false`: acceptable for local HTTP development, but should be `true` in production over HTTPS.

---

## 12. Redirecting Back to the Frontend

If the OAuth flow was started with `redirect=frontend`, the backend redirects the browser to the frontend callback page.

Frontend callback route:

- `front-end/src/pages/auth/GoogleAuthCallbackPage.tsx`

This page does not expect the access token in the URL. Instead, it completes the session by calling:

```ts
apiClient("/auth/refresh", { method: "POST" })
```

### Why use `/auth/refresh` here

At this point, the browser already has the refresh token cookie set by the backend callback response.

So the frontend can safely ask the backend for:

- the current authenticated user
- a fresh access token

without exposing sensitive credentials in the browser URL.

---

## 13. Session Completion on the Frontend

In `GoogleAuthCallbackPage.tsx`, the frontend:

1. Calls `POST /auth/refresh`
2. Receives:
   - `user`
   - `accessToken`
3. Stores the session via `completeSession(...)`
4. Shows a success toast
5. Redirects the user to `/home`

Session persistence helpers are in:

- `persistSession(...)`
- `completeSession(...)`
- `refetchSession(...)`

inside `front-end/src/hooks/use-auth.ts`.

### What is stored on the frontend

The frontend currently stores:

- `accessToken` in `localStorage`
- `user` in `localStorage`

The refresh token is not stored there; it stays in the cookie.

---

## 14. Required Environment Variables

The OAuth flow depends on backend environment variables such as:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`
- `FRONTEND_ORIGIN`
- `FRONTEND_GOOGLE_CALLBACK_URL` (optional override)
- `JWT_SECRET`
- `REFRESH_TOKEN_MAX_AGE`

### Callback URL rule

The callback URL configured in Google Cloud must match the backend callback route exactly, for example:

```text
http://localhost:8000/api/v1/auth/google/callback
```

If this URL does not match, Google will reject the OAuth flow.

---

## 15. Suggested Step-by-Step Implementation Checklist

If a team member needs to implement OAuth from scratch in a similar NestJS + React setup, the process is:

1. Create Google OAuth credentials in Google Cloud Console.
2. Add backend env variables for client ID, client secret, callback URL, and frontend origin.
3. Add a backend route to redirect users to Google's OAuth consent page.
4. Add a backend callback route to receive the authorization code.
5. Exchange the code for Google tokens.
6. Fetch the Google user profile.
7. Validate email presence and verification.
8. Find, link, or create a local user record.
9. Issue app-specific access and refresh tokens.
10. Store the refresh token in an HTTP-only cookie.
11. Redirect the browser to the frontend callback page.
12. In the frontend callback page, call the refresh endpoint to finalize the session.
13. Store the access token and user in frontend session storage logic.
14. Redirect the user into the authenticated app area.
15. Test both first-time signup and returning-user login cases.

---

## 17. Files Involved in This Repo

Backend:

- `back-end/src/auth/auth.controller.ts`
- `back-end/src/auth/auth.service.ts`
- `back-end/src/users/users.service.ts`
- `back-end/src/main.ts`

Frontend:

- `front-end/src/hooks/use-auth.ts`
- `front-end/src/pages/auth/GoogleAuthCallbackPage.tsx`
- `front-end/src/pages/auth/LoginPage.tsx`
- `front-end/src/pages/auth/SignUpPage.tsx`

Documentation:

- `doc/requirements.md`
- `doc/back-end-guide.md`
