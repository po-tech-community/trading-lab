import { useCallback, useState } from "react";

/**
 * AI Advisor "model" — a saved DCA strategy preset plus an optional AI
 * persona note. Stored client-side only (localStorage) until a backend
 * model-storage endpoint exists. Loaded by the Create Model page (AI-FE-9)
 * and surfaced for "use this model" actions.
 */
export interface AiAdvisorModel {
  /** Stable id (uuid-ish, generated client-side). */
  id: string;
  /** Human-readable name, e.g. "Conservative BTC weekly". */
  name: string;
  /** Optional one-line description. */
  description?: string;
  /** Asset symbol (e.g. BTC, AAPL). */
  symbol: string;
  /** USD amount per period. */
  amount: number;
  /** Recurring purchase cadence. */
  frequency: "daily" | "weekly" | "monthly";
  /** Take-profit threshold % (optional). */
  takeProfit?: number;
  /** Stop-loss threshold % (optional). */
  stopLoss?: number;
  /**
   * Free-form persona note appended to the AI Advisor system prompt when
   * this model is active. Lets the user steer tone/risk-appetite of replies.
   */
  personaNote?: string;
  /** ISO timestamp of creation. */
  createdAt: string;
}

const STORAGE_KEY = "tradingLab.aiModels";

function readModels(): AiAdvisorModel[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m): m is AiAdvisorModel =>
        typeof m === "object" &&
        m !== null &&
        typeof (m as AiAdvisorModel).id === "string" &&
        typeof (m as AiAdvisorModel).name === "string",
    );
  } catch {
    return [];
  }
}

function writeModels(models: AiAdvisorModel[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(models));
  } catch {
    // localStorage unavailable (private mode); ops become no-ops.
  }
}

function makeId(): string {
  // crypto.randomUUID is available in all evergreen browsers Vite targets.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface UseAiModelsReturn {
  models: AiAdvisorModel[];
  /** Add a new model — returns the persisted record (with id + timestamp). */
  addModel: (input: Omit<AiAdvisorModel, "id" | "createdAt">) => AiAdvisorModel;
  /** Remove by id. No-op if id is unknown. */
  removeModel: (id: string) => void;
}

/**
 * Tiny localStorage-backed CRUD for AI Advisor models.
 *
 * Intentionally synchronous + state-resident: there is no server round-trip,
 * and all consumers are inside one page (Create Model). If multiple tabs ever
 * need to stay in sync, swap the `useState` for a `storage` event listener.
 */
export function useAiModels(): UseAiModelsReturn {
  // Lazy initializer — runs once on first render. localStorage is safe to
  // read during render in a client-only Vite app, and this avoids the
  // setState-in-effect anti-pattern.
  const [models, setModels] = useState<AiAdvisorModel[]>(() => readModels());

  const addModel = useCallback(
    (input: Omit<AiAdvisorModel, "id" | "createdAt">) => {
      const record: AiAdvisorModel = {
        ...input,
        id: makeId(),
        createdAt: new Date().toISOString(),
      };
      setModels((prev) => {
        const next = [...prev, record];
        writeModels(next);
        return next;
      });
      return record;
    },
    [],
  );

  const removeModel = useCallback((id: string) => {
    setModels((prev) => {
      const next = prev.filter((m) => m.id !== id);
      writeModels(next);
      return next;
    });
  }, []);

  return { models, addModel, removeModel };
}
