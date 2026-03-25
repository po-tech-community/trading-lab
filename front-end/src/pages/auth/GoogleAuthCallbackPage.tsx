import { completeSession, type SessionPayload } from "@/hooks/use-auth";
import { Spinner } from "@/components/ui/spinner";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

function parseGoogleCallback(search: string): SessionPayload {
  const params = new URLSearchParams(search);
  const accessToken = params.get("accessToken");
  const encodedUser = params.get("user");

  if (!accessToken || !encodedUser) {
    throw new Error("Missing Google sign-in session data.");
  }

  return {
    accessToken,
    user: JSON.parse(decodeURIComponent(encodedUser)) as SessionPayload["user"],
  };
}

export default function GoogleAuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const session = parseGoogleCallback(window.location.search);
      completeSession(session);

      toast.success("Welcome back!", {
        description: `Logged in as ${session.user.firstName}`,
      });

      navigate("/home", { replace: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Google sign-in could not be completed.";

      toast.error("Google Sign-In Failed", {
        description: message,
      });

      navigate("/log-in", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="flex flex-col items-center gap-4 text-center">
        <Spinner className="size-8" />
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground">Completing Google sign-in</h1>
          <p className="text-sm text-muted-foreground">
            We&apos;re finalizing your session and taking you back into Trading Lab.
          </p>
        </div>
      </div>
    </div>
  );
}
