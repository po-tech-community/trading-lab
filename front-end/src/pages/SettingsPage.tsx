import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/common/PageHeader"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Workspace settings"
        description="Configure basic preferences for your TradingLab account. This page is mocked for now."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
            <CardDescription>Displayed across the app and in reports.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display name</Label>
              <Input id="display-name" placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notifications &amp; alerts</CardTitle>
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
          <CardTitle className="text-base">Data &amp; privacy</CardTitle>
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
          <Button variant="outline" size="sm">
            Save mock changes
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

