import { useCallback, useState } from "react";

/**
 * Per-MCP-tool enable/disable preferences (AI-FE-10).
 *
 * The backend exposes the canonical tool list, but doesn't currently honour a
 * per-user enable list — these toggles are persisted client-side only as a
 * forward-compatible UI surface. Once a BE preference endpoint exists (see
 * AI-FE-10 task note: "coordinate with Kha on the data structure"), the
 * shape `{ [toolName]: boolean }` can be PATCHed up directly.
 *
 * Tools default to enabled; a tool is considered disabled only when its key
 * is present and explicitly `false`.
 */

const STORAGE_KEY = "tradingLab.mcpToolPrefs";

export type McpToolPrefs = Record<string, boolean>;

function readPrefs(): McpToolPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const out: McpToolPrefs = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === "boolean") out[k] = v;
      }
      return out;
    }
    return {};
  } catch {
    return {};
  }
}

function writePrefs(prefs: McpToolPrefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // localStorage unavailable — toggles become non-persistent for this session.
  }
}

export interface UseMcpPrefsReturn {
  prefs: McpToolPrefs;
  /** True unless the tool is explicitly disabled. */
  isEnabled: (toolName: string) => boolean;
  /** Set a single tool's enabled state. */
  setEnabled: (toolName: string, enabled: boolean) => void;
  /** Reset all overrides — every tool reverts to its default (enabled). */
  reset: () => void;
}

export function useMcpPrefs(): UseMcpPrefsReturn {
  // Lazy initializer — same pattern as useAiModels (avoids setState-in-effect).
  const [prefs, setPrefs] = useState<McpToolPrefs>(() => readPrefs());

  const isEnabled = useCallback(
    (toolName: string) => prefs[toolName] !== false,
    [prefs],
  );

  const setEnabled = useCallback((toolName: string, enabled: boolean) => {
    setPrefs((prev) => {
      const next = { ...prev, [toolName]: enabled };
      writePrefs(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setPrefs(() => {
      writePrefs({});
      return {};
    });
  }, []);

  return { prefs, isEnabled, setEnabled, reset };
}
