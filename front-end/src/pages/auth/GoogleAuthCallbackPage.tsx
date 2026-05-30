import { completeSession } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import { Spinner } from "@/components/ui/spinner";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type RefreshResponse = {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
  accessToken: string;
};

export default function GoogleAuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const finishGoogleLogin = async () => {
      try {
        const session = await apiClient<RefreshResponse>("/auth/refresh", {
          method: "POST",
        });

        completeSession(session);

        toast.success("Welcome back!", {
          description: `Logged in as ${session.user.firstName}`,
        });

        navigate("/home", { replace: true });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Google sign-in could not be completed.";

        toast.error("Google Sign-In Failed", {
          description: message,
        });

        navigate("/log-in", { replace: true });
      }
    };

    finishGoogleLogin();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="flex flex-col items-center gap-4 text-center">
        <Spinner className="size-8" />
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground">
            Completing Google sign-in
          </h1>
          <p className="text-sm text-muted-foreground">
            We&apos;re finalizing your session and taking you back into Trading
            Lab.
          </p>
        </div>
      </div>
    </div>
  );
}
