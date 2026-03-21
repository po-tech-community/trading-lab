import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { useEffect, useState } from "react";

/**
 * Mock Authentication Hook
 * Provides mutations for login and signup with simulated API behavior.
 */

// Mock credentials for testing
// const MOCK_USER = {
//   email: "admin@tradinglab.com",
//   password: "Password123",
//   firstName: "Trading",
//   lastName: "LabAdmin",
// };

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

type RefreshResponse = {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  accessToken: string;
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

function saveSession(data: RefreshResponse | AuthResponse) {
  localStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("user", JSON.stringify(data.user));
}

function clearSession() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
}

async function refetchSession(): Promise<SessionState> {
  const accessToken = localStorage.getItem("accessToken");
  const userJson = localStorage.getItem("user");

  if (accessToken && userJson) {
    return {
      user: JSON.parse(userJson),
      isAuthenticated: true,
      isLoading: false,
    };
  }

  try {
    const data = await apiClient<RefreshResponse>("/auth/refresh", {
      method: "POST",
    });

    saveSession(data);

    return {
      user: data.user,
      isAuthenticated: true,
      isLoading: false,
    };
  } catch {
    clearSession();

    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
    };
  }
}
export function useLogin() {
  const navigate = useNavigate();

  return useMutation<AuthResponse, Error, LoginPayload>({
    mutationFn: async (data: LoginPayload) => {
      return apiClient<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });
    },
    onSuccess: (data) => {
      saveSession(data);

      toast.success("Welcome back!", {
        description: `Logged in as ${data.user.firstName ?? data.user.email}`,
      });

      navigate("/home");
    },
    onError: (error: Error) => {
      toast.error("Authentication Failed", {
        description: error.message,
      });
    },
  });
}

export function useSignUp() {
  const navigate = useNavigate();

  return useMutation<AuthResponse, Error, SignUpPayload>({
    mutationFn: async (data: SignUpPayload) => {
      return apiClient<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
        }),
      });
    },
    onSuccess: (data) => {
      saveSession(data);

      toast.success("Account created!", {
        description: "Welcome to Trading Lab.",
      });

      navigate("/home");
    },
    onError: (error: Error) => {
      toast.error("Registration Failed", {
        description: error.message,
      });
    },
  });
}

export function useLogout() {
  const navigate = useNavigate();

  const logout = () => {
    clearSession();
    toast.info("Logged out successfully");
    navigate("/log-in");
  };

  return { logout };
}

export function useSession() {
  const [session, setSession] = useState<SessionState>(() => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  }));

  useEffect(() => {
    const restoreSession = async () => {
      const nextSession = await refetchSession();
      setSession(nextSession);
    };

    restoreSession();
  }, []);

  const refetch = async () => {
    setSession((prev) => ({
      ...prev,
      isLoading: true,
    }));

    const nextSession = await refetchSession();
    setSession(nextSession);

    return nextSession;
  };

  return {
    ...session,
    refetch,
  };
}