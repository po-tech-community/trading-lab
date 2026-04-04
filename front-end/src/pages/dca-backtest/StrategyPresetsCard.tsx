import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getCryptoMinUtcIsoDate,
  getTodayUtcIsoDate,
} from "./backtest-form-schema";

/** Preset labels only; buttons are non-functional until wired to form state */
const today = getTodayUtcIsoDate();
const cryptoMin = getCryptoMinUtcIsoDate();

const PRESETS = [
  `BTC · $100 weekly · ${cryptoMin} -> ${today}`,
  `ETH · $50 weekly · ${cryptoMin} -> ${today}`,
  `AAPL · $200 monthly · ${cryptoMin} -> ${today}`,
  `TSLA · $100 weekly · ${cryptoMin} -> ${today}`,
];

/**
 * Card with quick-preset buttons for common DCA configs.
 * Mock: clicking does not update the strategy form yet.
 */
export function StrategyPresetsCard() {
  return (
    <Card className="py-6">
      <CardHeader>
        <CardTitle className="text-base">Strategy presets</CardTitle>
        <CardDescription>
          Quick DCA ideas with a fixed time window (from one year ago to today).
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
  );
}
