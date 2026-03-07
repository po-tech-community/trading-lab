import { ThemeSwitch } from "@/components/theme-switch"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, TrendingUp, Zap } from "lucide-react"
import { Link } from "react-router-dom"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-20 flex items-center justify-between px-6 md:px-12 border-b border-border/40 backdrop-blur-md sticky top-0 z-50 bg-background/80">
        <div className="flex items-center gap-2">
          <div className="size-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <TrendingUp className="size-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">Trading Lab</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeSwitch />
          <Button variant="ghost" asChild className="hidden md:inline-flex">
            <Link to="/log-in">Log in</Link>
          </Button>
          <Button asChild>
            <Link to="/sign-up">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 animate-in fade-in slide-in-from-bottom-3 duration-1000">
            <Zap className="size-4" />
            <span>New: AI Portfolio Advisor is now live</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100">
            Master Your DCA Strategy <br className="hidden md:block" /> with Data & AI
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-muted-foreground animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-200">
            Backtest your investment ideas, simulate Dollar Cost Averaging, and get AI-powered insights for your crypto and stock portfolios.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
            <Button size="lg" className="h-14 px-8 text-lg rounded-full" asChild>
              <Link to="/sign-up">Start Free Backtest <ArrowRight className="ml-2 size-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full" asChild>
              <Link to="/log-in">View Demo Dashboard</Link>
            </Button>
          </div>

          {/* Abstract Preview */}
          <div className="pt-20 animate-in fade-in zoom-in-95 duration-1000 delay-500">
            <div className="relative mx-auto max-w-5xl rounded-2xl border border-border/50 bg-muted/30 aspect-[16/9] shadow-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="p-8 text-left space-y-4 max-w-md bg-background/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                    <div className="h-2 w-24 bg-primary/40 rounded-full" />
                    <div className="h-4 w-full bg-foreground/20 rounded-full" />
                    <div className="h-4 w-2/3 bg-foreground/20 rounded-full" />
                    <div className="pt-4 grid grid-cols-3 gap-2">
                        <div className="h-12 bg-primary/20 rounded-lg" />
                        <div className="h-12 bg-primary/20 rounded-lg" />
                        <div className="h-12 bg-primary/20 rounded-lg" />
                    </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute top-10 left-10 size-32 bg-primary/20 blur-3xl rounded-full" />
              <div className="absolute bottom-10 right-10 size-32 bg-primary/20 blur-3xl rounded-full" />
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 bg-muted/30 border-y border-border/40">
           <div className="max-w-7xl mx-auto px-6 md:px-12 grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
                <div className="size-12 rounded-xl bg-background border border-border shadow-sm flex items-center justify-center text-primary">
                    <TrendingUp className="size-6" />
                </div>
                <h3 className="text-xl font-bold">Historical Backtest</h3>
                <p className="text-muted-foreground">Test your DCA strategies against real market data from 2010 to present day.</p>
            </div>
            <div className="space-y-4">
                <div className="size-12 rounded-xl bg-background border border-border shadow-sm flex items-center justify-center text-primary">
                    <Zap className="size-6" />
                </div>
                <h3 className="text-xl font-bold">Multi-Asset Portfolio</h3>
                <p className="text-muted-foreground">Mix BTC, ETH, and US stocks like AAPL or TSLA to see how they perform together.</p>
            </div>
            <div className="space-y-4">
                <div className="size-12 rounded-xl bg-background border border-border shadow-sm flex items-center justify-center text-primary">
                    <Shield className="size-6" />
                </div>
                <h3 className="text-xl font-bold">AI Advisory</h3>
                <p className="text-muted-foreground">Get instant analysis of your portfolio risk and performance from our AI chatbot.</p>
            </div>
           </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 md:px-12 border-t border-border/40 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Trading Lab. Advanced DCA Simulation Platform.
        </p>
      </footer>
    </div>
  )
}
