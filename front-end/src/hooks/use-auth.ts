import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

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

export function useLogin() {
  const navigate = useNavigate();

  return useMutation<AuthResponse>({
    mutationFn: async (data: any) => {
      return apiClient<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });
    },
    onSuccess: (data) => {
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));

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

  return useMutation<AuthResponse>({
    mutationFn: async (data: any) => {
      return apiClient("/auth/register", {
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
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));

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
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    toast.info("Logged out successfully");
    navigate("/log-in");
  };

  return { logout };
}

export function useSession() {
  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;
  const isAuthenticated = !!localStorage.getItem("accessToken");

  return {
    user,
    isAuthenticated,
  };
}
