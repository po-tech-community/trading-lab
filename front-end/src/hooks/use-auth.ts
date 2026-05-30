import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { setAccessToken } from "@/lib/auth-token";
import { env } from "@/lib/env";

/**
 * Authentication hook.
 *
 * Token storage strategy:
 *  - Access token  → in-memory only (module variable in auth-token.ts).
 *                    Never written to localStorage or sessionStorage.
 *  - Refresh token → HttpOnly cookie, managed by the backend Set-Cookie header.
 *                    JavaScript cannot read it at all.
 *  - User profile  → localStorage, for fast UI restore on reload (not sensitive).
 *
 * On page reload: useSession calls /auth/refresh which reads the HttpOnly cookie
 * and issues a new access token into memory. No localStorage token check needed.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

type AuthResponse = {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  accessToken: string;
};

type SessionState = {
  user: AuthResponse["user"] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

type LoginPayload = {
  email: string;
  password: string;
};

type SignUpPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
}

export interface SessionPayload {
  user: SessionUser;
  accessToken: string;
}

// ── Session helpers ───────────────────────────────────────────────────────────

/**
 * Persist the session after login / register / refresh.
 * Access token goes to memory only. User profile goes to localStorage
 * so the UI can render the avatar/name immediately on the next page load
 * without waiting for the /auth/refresh round-trip.
 */
function persistSession(data: AuthResponse | SessionPayload): void {
  setAccessToken(data.accessToken);
  localStorage.setItem("user", JSON.stringify(data.user));
}

function clearSession(): void {
  setAccessToken(null);
  localStorage.removeItem("user");
}

/**
 * Restore session on page load.
 *
 * Always calls /auth/refresh first — the HttpOnly cookie carries the refresh
 * token so the browser sends it automatically. On success the new access token
 * is written to memory and we are done.
 *
 * The localStorage user entry is only used to return a user object immediately
 * while the refresh call is in flight (future enhancement: optimistic render).
 * Here we keep it simple: wait for the refresh before setting isAuthenticated.
 */
async function refetchSession(): Promise<SessionState> {
  try {
    const data = await apiClient<AuthResponse>("/auth/refresh", {
      method: "POST",
    });

    persistSession(data);

    return {
      user: data.user,
      isAuthenticated: true,
      isLoading: false,
    };
  } catch {
    // Refresh token is missing, expired, or revoked — user must log in again.
    clearSession();
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
    };
  }
}

// ── Google OAuth ──────────────────────────────────────────────────────────────

export function beginGoogleAuth() {
  window.location.href = `${env.apiUrl}/auth/google?redirect=frontend`;
}

export function completeSession(data: SessionPayload) {
  persistSession(data);
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  type LocationState = { from?: { pathname?: string } };
  const from = (location.state as LocationState)?.from?.pathname ?? "/home";

  return useMutation<AuthResponse, Error, LoginPayload>({
    mutationFn: (data) =>
      apiClient<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: data.email, password: data.password }),
      }),
    onSuccess: (data) => {
      persistSession(data);
      toast.success("Welcome back!", {
        description: `Logged in as ${data.user.firstName ?? data.user.email}`,
      });
      navigate(from, { replace: true });
    },
    onError: (error) => {
      toast.error("Authentication Failed", { description: error.message });
    },
  });
}

export function useSignUp() {
  const navigate = useNavigate();

  return useMutation<AuthResponse, Error, SignUpPayload>({
    mutationFn: (data) =>
      apiClient<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
        }),
      }),
    onSuccess: (data) => {
      persistSession(data);
      toast.success("Account created!", { description: "Welcome to Trading Lab." });
      navigate("/home");
    },
    onError: (error) => {
      toast.error("Registration Failed", { description: error.message });
    },
  });
}

export function useLogout() {
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await apiClient("/auth/logout", { method: "POST" });
    } catch {
      // Clear local session even if the backend call fails.
    } finally {
      clearSession();
      toast.info("Logged out successfully");
      navigate("/log-in");
    }
  };

  return { logout };
}

// ── Session state ─────────────────────────────────────────────────────────────

export function useSession() {
  const [session, setSession] = useState<SessionState>(() => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  }));

  useEffect(() => {
    refetchSession().then(setSession);
  }, []);

  const refetch = async () => {
    setSession((prev) => ({ ...prev, isLoading: true }));
    const next = await refetchSession();
    setSession(next);
    return next;
  };

  return { ...session, refetch };
}
