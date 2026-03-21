import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { apiClient } from "@/lib/api-client";
import { useSession } from "@/hooks/use-auth";

type MeResponse = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
};

type UpdateMePayload = {
  firstName: string;
  lastName: string;
};

export default function SettingsPage() {
  const { user, refetch } = useSession();

  const [profile, setProfile] = useState<MeResponse | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await apiClient<Partial<MeResponse>>("/users/me");
        if (!data || !data.email) {
          throw new Error("Empty profile response");
        }

        setProfile(data as MeResponse);
        setFirstName(data.firstName ?? "");
        setLastName(data.lastName ?? "");
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload: UpdateMePayload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      };

      const data = await apiClient<Partial<MeResponse>>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      
      if (!data || !data.email) {
        setSuccess("Profile updated successfully.");
        await refetch();
        return;
      }
      
      setProfile(data as MeResponse);
      setFirstName(data.firstName ?? "");
      setLastName(data.lastName ?? "");
      setSuccess("Profile updated successfully.");

      await refetch();
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workspace settings"
        description="Configure basic preferences for your TradingLab account."
      />

      {(error || success) && (
        <Card>
          <CardContent className="pt-6">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {success ? <p className="text-sm text-green-600">{success}</p> : null}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
            <CardDescription>Displayed across the app and in reports.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading profile...</p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="first-name">First name</Label>
                  <Input
                    id="first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Your first name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last-name">Last name</Label>
                  <Input
                    id="last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Your last name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile?.email ?? user?.email ?? ""}
                    disabled
                  />
                </div>

                <Button onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save changes"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notifications & alerts</CardTitle>
            <CardDescription>Control how we keep you updated about your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="email-alerts">Email summaries</Label>
                <p className="text-sm text-muted-foreground">
                  Receive a periodic summary of portfolio performance and major changes.
                </p>
              </div>
              <Switch id="email-alerts" />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="trade-alerts">Trade alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when a backtest or live strategy hits key thresholds.
                </p>
              </div>
              <Switch id="trade-alerts" />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="product-updates">Product updates</Label>
                <p className="text-sm text-muted-foreground">
                  Occasionally hear about new features and improvements.
                </p>
              </div>
              <Switch id="product-updates" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data & privacy</CardTitle>
          <CardDescription>Informational copy only – no real actions yet.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            In a real implementation, this section would allow you to download your data, manage
            connected exchanges, and configure retention policies for historical backtests.
          </p>
          <p>
            For now this page is only a front-end mock to help you iterate on layout, navigation,
            and styling without touching backend services.
          </p>
          <Button variant="outline" size="sm" disabled>
            Coming soon
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}