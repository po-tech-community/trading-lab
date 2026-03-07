import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

/**
 * Mock Authentication Hook
 * Provides mutations for login and signup with simulated API behavior.
 */

// Mock credentials for testing
const MOCK_USER = {
  email: "admin@tradinglab.com",
  password: "Password123",
  firstName: "Trading",
  lastName: "LabAdmin",
};

export function useLogin() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: any) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock validation
      if (data.email === MOCK_USER.email && data.password === MOCK_USER.password) {
        return {
          user: {
            id: "mock-id-123",
            email: MOCK_USER.email,
            firstName: MOCK_USER.firstName,
            lastName: MOCK_USER.lastName,
          },
          accessToken: "mock-jwt-token-access",
          refreshToken: "mock-jwt-token-refresh",
        };
      }

      throw new Error("Invalid email or password. Please try again.");
    },
    onSuccess: (data) => {
      // Persist mock session
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      toast.success("Welcome back!", {
        description: `Logged in as ${data.user.firstName}`,
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

  return useMutation({
    mutationFn: async (data: any) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock conflict check
      if (data.email === MOCK_USER.email) {
        throw new Error("This email is already registered.");
      }

      return {
        user: {
          id: "mock-new-id-" + Math.random().toString(36).substr(2, 9),
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
        },
        accessToken: "mock-jwt-token-access-new",
        refreshToken: "mock-jwt-token-refresh-new",
      };
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
