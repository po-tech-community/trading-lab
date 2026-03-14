import { Link } from "react-router-dom"
import { PieChart, LineChart, Bot, Settings2, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/common/PageHeader"

const quickActions = [
  {
    title: "Portfolio",
    description: "View holdings and strategy performance",
    href: "/home/portfolio",
    icon: PieChart,
  },
  {
    title: "DCA Backtest",
    description: "Simulate recurring investment returns",
    href: "/home/backtest",
    icon: LineChart,
  },
  {
    title: "AI Advisor",
    description: "Chat and get market insights",
    href: "/home/ai-advisor",
    icon: Bot,
  },
  {
    title: "Settings",
    description: "Workspace and preferences",
    href: "/home/settings",
    icon: Settings2,
  },
]

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
            const Icon = item.icon
            return (
              <Link key={item.href} to={item.href} className="group">
                <Card className="h-full transition-all duration-200 hover:bg-accent/50 hover:-translate-y-0.5 hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 -ml-2 transition-transform group-hover:translate-x-1"
                    >
                      Open
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Short intro cards */}
      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">DCA Simulator</CardTitle>
            <CardDescription>
              Backtest dollar-cost averaging over historical data. Pick an asset, amount, and
              frequency to see how a recurring strategy would have performed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link to="/home/backtest">Go to DCA Backtest</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Advisor</CardTitle>
            <CardDescription>
              Get insights and answers about markets and your strategies. Use the floating
              chat or open the full AI Advisor workspace from the sidebar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link to="/home/ai-advisor">Open AI Advisor</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
