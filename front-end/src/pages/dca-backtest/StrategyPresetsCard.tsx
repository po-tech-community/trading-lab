import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

/** Preset labels only; buttons are non-functional until wired to form state */
const PRESETS = [
  "BTC · $100 weekly · 1 year",
  "ETH · $50 weekly · 2 years",
  "AAPL · $200 monthly · 3 years",
  "TSLA · $100 bi-weekly · 18 months",
]

/**
 * Card with quick-preset buttons for common DCA configs.
 * Mock: clicking does not update the strategy form yet.
 */
export function StrategyPresetsCard() {
  return (
    <Card className="py-6">
      <CardHeader>
        <CardTitle className="text-base">Strategy presets (mock)</CardTitle>
        <CardDescription>
          Quickly try a few common DCA configurations. These buttons do not change inputs yet.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2 text-sm">
        {PRESETS.map((label) => (
          <Button key={label} variant="outline" size="sm">
            {label}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
