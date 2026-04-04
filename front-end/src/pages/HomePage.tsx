import { Link } from "react-router-dom";
import { PieChart, LineChart, Bot, Settings2, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/PageHeader";

const quickActions = [
  {
    title: "Portfolio Backtest",
    description: "Simulate multi-asset DCA with custom weights",
    usage: "Allocate weights across multiple assets (BTC, ETH, stocks), set amount & frequency, and see diversified portfolio performance.",
    href: "/home/portfolio",
    icon: PieChart,
    enabled: true,
    type: "Multi-asset",
  },
  {
    title: "DCA Backtest",
    description: "Simulate single-asset recurring investment",
    usage: "Pick one asset, set amount & frequency, define date range, and analyze returns from historical DCA purchases.",
    href: "/home/backtest",
    icon: LineChart,
    enabled: true,
    type: "Single-asset",
  },
  {
    title: "AI Advisor",
    description: "Chat and get market insights",
    usage: "Coming soon: chat with the advisor after it is wired to real backtest data.",
    href: "/home/ai-advisor",
    icon: Bot,
    enabled: false,
  },
  {
    title: "Settings",
    description: "Workspace and preferences",
    usage: "Update your profile and basic account preferences.",
    href: "/home/settings",
    icon: Settings2,
    enabled: true,
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col gap-8">
      <PageHeader
        title="Welcome to Trading Lab"
        description="Your workspace for DCA simulation, portfolio tracking, and AI-assisted analysis. Use the quick actions below or the sidebar to jump into any tool."
      />

      {/* Quick actions */}
      <section>
        <h2 className="text-base font-medium mb-4">Quick actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                className={
                  item.enabled
                    ? "h-full transition-all duration-200 hover:bg-accent/50 hover:-translate-y-0.5 hover:shadow-md"
                    : "h-full opacity-60 border-dashed"
                }
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {item.type && (
                        <Badge variant="outline" className="text-xs">
                          {item.type}
                        </Badge>
                      )}
                      <Badge
                        variant={item.enabled ? "default" : "secondary"}
                        className="shrink-0"
                      >
                        {item.enabled ? "Available" : "Coming soon"}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.usage}
                  </p>
                  {item.enabled ? (
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="gap-1 -ml-2 transition-transform group-hover:translate-x-1"
                    >
                      <Link to={item.href}>
                        Open
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 -ml-2"
                      disabled
                    >
                      Open
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Short intro cards */}
      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">DCA Simulator</CardTitle>
            <CardDescription>
              Run a recurring-investment backtest. Pick an asset, amount, and
              frequency, then compare portfolio value vs invested capital.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-muted-foreground">
              How to use: open the backtest page, choose a symbol, set the date
              range, and click calculate.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/home/backtest">Go to DCA Backtest</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Advisor</CardTitle>
            <CardDescription>
              Coming soon: ask short questions about your strategy after the
              advisor is connected to real backtest data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-muted-foreground">
              How to use: not available yet.
            </p>
            <Button variant="outline" size="sm" disabled>
              Open AI Advisor
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
