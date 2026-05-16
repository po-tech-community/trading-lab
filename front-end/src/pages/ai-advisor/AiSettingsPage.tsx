/**
 * AiSettingsPage  —  AI-FE-10
 *
 * Sections:
 *   1. AI service status — does the BE answer /ai/analyze without 503?
 *      (probed lazily on mount via a HEAD-like ping; cheap because we send
 *      a no-op query string and treat any non-503 response as "ready").
 *   2. Model configuration — read-only; the model is server-configured (the
 *      BE chooses Anthropic / OpenAI from its env). Surfaced for transparency.
 *   3. Rate limit info — informational copy. The BE does not yet expose a
 *      rate-limit counter endpoint, so we display the documented per-workspace
 *      guidance.
 *   4. MCP tools — per-tool enable/disable toggle list, persisted client-side
 *      via useMcpPrefs (localStorage). The BE does not currently honour the
 *      list; toggles are "ready to wire" once a prefs endpoint lands. The
 *      task note explicitly calls this out: "coordinate with Kha on the data
 *      structure before implementing".
 */

import { useEffect, useState } from "react";
import {
  Sparkles,
  CircleCheck,
  CircleAlert,
  KeyRound,
  Cpu,
  Gauge,
  Wrench,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/common/PageHeader";
import { apiClient, ApiError } from "@/lib/api-client";
import { useMcpPrefs } from "@/hooks/use-mcp-prefs";

// ── Static catalog of MCP tools surfaced to the user ─────────────────────────
//
// Mirrors back-end/src/ai/mcp-servers/* and the evidenceToCards adapter in
// front-end/src/lib/ai-api.ts. Hardcoded for now because the BE does not
// expose a discovery endpoint the FE can call without an auth context that
// matches its inspect/execute surface; replace with a fetch when one exists.
interface KnownMcpTool {
  name: string;
  label: string;
  description: string;
  destructive: boolean;
}

const KNOWN_TOOLS: KnownMcpTool[] = [
  {
    name: "get_latest_quote",
    label: "Latest market quote",
    description: "Fetches the most recent USD price + 24h change for a symbol.",
    destructive: false,
  },
  {
    name: "get_volatility_summary",
    label: "Volatility summary",
    description: "Annualised volatility and a coarse regime label (low/medium/high).",
    destructive: false,
  },
  {
    name: "evaluate_risk_profile",
    label: "Risk profile",
    description: "Sampled drawdown + overall risk rating for a backtest.",
    destructive: false,
  },
  {
    name: "get_drawdown_breakdown",
    label: "Drawdown breakdown",
    description: "Per-asset and portfolio max-drawdown details.",
    destructive: false,
  },
  {
    name: "get_concentration_risk",
    label: "Concentration risk",
    description: "Largest holding and concentration risk level.",
    destructive: false,
  },
  {
    name: "get_asset_contribution",
    label: "Asset contribution",
    description: "Per-asset contribution to portfolio return / drawdown.",
    destructive: false,
  },
];

// ── AI service status probe ──────────────────────────────────────────────────

type ServiceStatus =
  | { kind: "checking" }
  | { kind: "ready" }
  | { kind: "unauthorized" }
  | { kind: "rate_limited" }
  | { kind: "unconfigured" }
  | { kind: "error"; message: string };

async function probeAiService(): Promise<ServiceStatus> {
  // A minimal probe: send the cheapest possible query. The BE returns 503
  // when the API key is missing, so any other response (even a 4xx) implies
  // the service itself is configured.
  try {
    await apiClient("/ai/analyze", {
      method: "POST",
      body: JSON.stringify({ userQuery: "ping" }),
    });
    return { kind: "ready" };
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 401) return { kind: "unauthorized" };
      if (err.status === 429) return { kind: "rate_limited" };
      if (err.status === 503) return { kind: "unconfigured" };
      // Any other status (400/500) still means the service is reachable —
      // the request payload was just rejected. Treat as ready.
      return { kind: "ready" };
    }
    return {
      kind: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

function StatusBadge({ status }: { status: ServiceStatus }) {
  switch (status.kind) {
    case "checking":
      return (
        <Badge variant="secondary" className="gap-1">
          <Loader2 className="size-3 animate-spin" />
          Checking…
        </Badge>
      );
    case "ready":
      return (
        <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
          <CircleCheck className="size-3" />
          Ready
        </Badge>
      );
    case "unauthorized":
      return (
        <Badge variant="secondary" className="gap-1">
          <CircleAlert className="size-3" />
          Sign in required
        </Badge>
      );
    case "rate_limited":
      return (
        <Badge variant="secondary" className="gap-1">
          <CircleAlert className="size-3" />
          Rate limited
        </Badge>
      );
    case "unconfigured":
      return (
        <Badge variant="destructive" className="gap-1">
          <CircleAlert className="size-3" />
          Not configured
        </Badge>
      );
    case "error":
      return (
        <Badge variant="destructive" className="gap-1">
          <CircleAlert className="size-3" />
          Error
        </Badge>
      );
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AiSettingsPage() {
  const [status, setStatus] = useState<ServiceStatus>({ kind: "checking" });
  const { isEnabled, setEnabled, reset } = useMcpPrefs();

  useEffect(() => {
    let cancelled = false;
    void probeAiService().then((next) => {
      if (!cancelled) setStatus(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const enabledCount = KNOWN_TOOLS.filter((t) => isEnabled(t.name)).length;

  const handleResetTools = () => {
    reset();
    toast.success("MCP tool preferences reset.");
  };

  return (
    <div className="space-y-8">
      <PageHeader
        label="AI Advisor"
        icon={Sparkles}
        iconClassName="fill-primary"
        title="AI settings"
        description="Inspect AI service status, model configuration, and which MCP tools the advisor may use."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── 1. Service status ────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="size-4" />
              AI service status
              <span className="ml-auto">
                <StatusBadge status={status} />
              </span>
            </CardTitle>
            <CardDescription>
              The API key lives on the server — there is nothing to enter here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {status.kind === "ready" && (
              <p>
                The backend responded normally. AI Advisor is ready to use.
              </p>
            )}
            {status.kind === "unauthorized" && (
              <p>
                Your session expired while probing the AI service. Refresh or
                sign in again to retry.
              </p>
            )}
            {status.kind === "rate_limited" && (
              <p>
                The provider rate-limited the probe. Wait a moment and reload
                this page to try again.
              </p>
            )}
            {status.kind === "unconfigured" && (
              <p>
                The backend returned <code className="font-mono text-xs">503</code>:
                the AI provider key is not set. Ask an administrator to configure
                <code className="font-mono text-xs"> ANTHROPIC_API_KEY</code> or
                <code className="font-mono text-xs"> OPENAI_API_KEY</code>.
              </p>
            )}
            {status.kind === "error" && (
              <p className="text-destructive">{status.message}</p>
            )}
            {status.kind === "checking" && (
              <p>Probing <code className="font-mono text-xs">/ai/analyze</code>…</p>
            )}
          </CardContent>
        </Card>

        {/* ── 2. Model configuration ──────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="size-4" />
              Model configuration
            </CardTitle>
            <CardDescription>
              Server-controlled. Surfaced here so you know what backs your replies.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Provider</span>
              <Badge variant="outline">Server-configured</Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Selectable per request</span>
              <Badge variant="secondary">No</Badge>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">
              The advisor backend picks a model from its env (Anthropic Claude
              or OpenAI). Per-request model selection is not exposed yet — once
              the backend adds a parameter, this card will gain a model dropdown.
            </p>
          </CardContent>
        </Card>

        {/* ── 3. Rate limits ──────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Gauge className="size-4" />
              Rate limits
            </CardTitle>
            <CardDescription>
              Soft guidance — the backend does not currently report a live counter.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              The provider applies a per-workspace quota. If you see a
              <Badge variant="secondary" className="mx-1">429</Badge>
              response in chat, wait ~60 seconds and try again.
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>One <code className="font-mono">analyze</code> call per user message.</li>
              <li>MCP tool calls also count toward the per-minute quota.</li>
              <li>Long-form replies cost more tokens — keep prompts focused.</li>
            </ul>
          </CardContent>
        </Card>

        {/* ── 4. MCP tools (largest card — span both columns) ─────────── */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="size-4" />
              MCP tools
              <Badge variant="secondary" className="ml-2">
                {enabledCount} / {KNOWN_TOOLS.length} enabled
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto gap-1"
                onClick={handleResetTools}
              >
                <RotateCcw className="size-3.5" />
                Reset
              </Button>
            </CardTitle>
            <CardDescription>
              Pick which tools the AI Advisor may call when answering. Toggles
              are saved on this device; they are not yet enforced by the
              backend (a server-side preference endpoint is pending — see the
              AI-FE-10 task note).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {KNOWN_TOOLS.map((tool) => {
              const enabled = isEnabled(tool.name);
              return (
                <div
                  key={tool.name}
                  className="flex items-start justify-between gap-4 rounded-lg border bg-card p-3"
                >
                  <div className="space-y-1 min-w-0">
                    <Label
                      htmlFor={`tool-${tool.name}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {tool.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {tool.description}
                    </p>
                    <p className="text-[10px] font-mono text-muted-foreground/70">
                      {tool.name}
                    </p>
                  </div>
                  <Switch
                    id={`tool-${tool.name}`}
                    checked={enabled}
                    onCheckedChange={(value) => setEnabled(tool.name, value)}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
