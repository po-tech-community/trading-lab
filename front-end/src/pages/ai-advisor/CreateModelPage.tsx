/**
 * CreateModelPage  —  AI-FE-9
 *
 * "Create model" in the AI Advisor context is a saved DCA strategy preset
 * bundled with an optional AI persona note. The user names the model, fills
 * in the strategy fields they would otherwise type into the DCA backtest
 * form (symbol, amount, frequency, optional TP/SL), and adds a free-form
 * persona note that can later be appended to the AI advisor system prompt.
 *
 * Models are stored client-side in localStorage via `useAiModels` — there is
 * no backend storage endpoint for models yet. Listed underneath the form
 * with Use / Delete buttons. "Use" navigates to /home/backtest with a hint
 * toast (auto-prefilling the backtest form is a follow-up that needs a small
 * change in DcaBacktestPage to read the active model from localStorage).
 */

import { useNavigate } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  BrainCircuit,
  Bookmark,
  Trash2,
  Sparkles,
  ArrowRight,
  Plus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import {
  useAiModels,
  type AiAdvisorModel,
} from "@/hooks/use-ai-models";

// ── Form schema ──────────────────────────────────────────────────────────────

const modelFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(60, "Keep names under 60 characters"),
  description: z.string().max(160, "Keep descriptions under 160 characters").optional(),
  symbol: z
    .string()
    .min(1, "Symbol is required")
    .max(10, "Symbol seems too long")
    .transform((s) => s.trim().toUpperCase()),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  takeProfit: z.coerce
    .number()
    .min(0, "Take profit must be ≥ 0")
    .max(1000, "Take profit too large")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  stopLoss: z.coerce
    .number()
    .min(0, "Stop loss must be ≥ 0")
    .max(100, "Stop loss must be ≤ 100")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  personaNote: z.string().max(500, "Persona note too long").optional(),
});

type ModelFormValues = z.infer<typeof modelFormSchema>;

const DEFAULT_VALUES: ModelFormValues = {
  name: "",
  description: "",
  symbol: "BTC",
  amount: 100,
  frequency: "weekly",
  takeProfit: undefined,
  stopLoss: undefined,
  personaNote: "",
};

const ACTIVE_MODEL_KEY = "tradingLab.activeAiModel";

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CreateModelPage() {
  const navigate = useNavigate();
  const { models, addModel, removeModel } = useAiModels();

  const form = useForm<ModelFormValues, unknown, ModelFormValues>({
    resolver: zodResolver(modelFormSchema) as Resolver<ModelFormValues, unknown, ModelFormValues>,
    defaultValues: DEFAULT_VALUES,
  });

  const handleSubmit = (values: ModelFormValues) => {
    const record = addModel({
      name: values.name.trim(),
      description: values.description?.trim() || undefined,
      symbol: values.symbol,
      amount: values.amount,
      frequency: values.frequency,
      takeProfit: values.takeProfit,
      stopLoss: values.stopLoss,
      personaNote: values.personaNote?.trim() || undefined,
    });
    toast.success(`Saved "${record.name}".`);
    form.reset(DEFAULT_VALUES);
  };

  const handleUse = (model: AiAdvisorModel) => {
    // Persist the "active" model so the DCA backtest page can read it on
    // mount in a follow-up (out of scope for AI-FE-9 to avoid touching
    // DcaBacktestPage). The toast tells the user where to go in the meantime.
    try {
      localStorage.setItem(ACTIVE_MODEL_KEY, model.id);
    } catch {
      // ignore — toast still gives feedback below
    }
    toast.success(
      `Loaded "${model.name}". Open DCA Backtest to apply ${model.symbol} / ${model.frequency}.`,
    );
    navigate("/home/backtest");
  };

  const handleDelete = (model: AiAdvisorModel) => {
    removeModel(model.id);
    toast(`Deleted "${model.name}".`);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        label="AI Advisor"
        icon={Sparkles}
        iconClassName="fill-primary"
        title="Create a model"
        description="Save a named DCA strategy preset and an AI persona note so you can re-use them across runs."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        {/* ── Form card ────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BrainCircuit className="size-4 text-primary" />
              New model
            </CardTitle>
            <CardDescription>
              All fields except name &amp; strategy basics are optional.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-5"
              >
                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Conservative BTC weekly" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Long-horizon BTC accumulation, no triggers"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Strategy basics */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="symbol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Symbol</FormLabel>
                        <FormControl>
                          <Input placeholder="BTC" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (USD)</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} step="any" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequency</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Triggers (optional) */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="takeProfit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Take profit % (optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step="any"
                            placeholder="e.g. 25"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stopLoss"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stop loss % (optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step="any"
                            placeholder="e.g. 15"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Persona note */}
                <FormField
                  control={form.control}
                  name="personaNote"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AI persona note (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="e.g. Prioritize capital preservation. Be concise. Flag drawdowns over 20% explicitly."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Appended to the AI Advisor system prompt when this
                        model is active. Keep it short and behavioral.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center gap-2">
                  <Button type="submit" className="gap-2">
                    <Plus className="size-4" />
                    Save model
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => form.reset(DEFAULT_VALUES)}
                  >
                    Reset
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* ── Saved models list ───────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bookmark className="size-4" />
              Saved models
              <Badge variant="secondary" className="ml-auto">
                {models.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Stored on this device only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {models.length === 0 ? (
              <EmptyState
                icon={<BrainCircuit className="size-8 text-muted-foreground" />}
                title="No models yet"
                description="Fill in the form to save your first preset."
              />
            ) : (
              models.map((model) => (
                <SavedModelRow
                  key={model.id}
                  model={model}
                  onUse={() => handleUse(model)}
                  onDelete={() => handleDelete(model)}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Row component ────────────────────────────────────────────────────────────

function SavedModelRow({
  model,
  onUse,
  onDelete,
}: {
  model: AiAdvisorModel;
  onUse: () => void;
  onDelete: () => void;
}) {
  const triggerSummary = (() => {
    const parts: string[] = [];
    if (model.takeProfit != null) parts.push(`TP ${model.takeProfit}%`);
    if (model.stopLoss != null) parts.push(`SL ${model.stopLoss}%`);
    return parts.length ? parts.join(" · ") : "No triggers";
  })();

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{model.name}</p>
          {model.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {model.description}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          aria-label={`Delete ${model.name}`}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5 text-xs">
        <Badge variant="outline">{model.symbol}</Badge>
        <Badge variant="outline">${model.amount}</Badge>
        <Badge variant="outline" className="capitalize">
          {model.frequency}
        </Badge>
        <Badge variant="outline">{triggerSummary}</Badge>
      </div>

      {model.personaNote && (
        <p className="text-xs text-muted-foreground italic line-clamp-2">
          “{model.personaNote}”
        </p>
      )}

      <Button
        size="sm"
        variant="secondary"
        onClick={onUse}
        className="gap-1 w-full"
      >
        Use this model
        <ArrowRight className="size-3.5" />
      </Button>
    </div>
  );
}
