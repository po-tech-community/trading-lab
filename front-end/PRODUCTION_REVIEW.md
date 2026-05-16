# TradingLab Front-End — Production Readiness Review

**Date:** 2026-05-17  
**Last updated:** 2026-05-17 (session 2)  
**Branch:** `develop`  
**Stack:** React 19, TypeScript 5.9, Vite 7, TanStack Query v5, Tailwind CSS v4, shadcn/ui

---

## Session 2 — Changes Applied

The following issues were resolved after the initial review:

| Area | Change |
|------|--------|
| ✅ B2 resolved | `PortfolioPage.tsx` unused imports eliminated — fullscreen feature added, all symbols now used |
| ✅ Portfolio AI wiring | `onSuggestedAction` connected to `PortfolioConfigCard` via `forwardRef` + `useImperativeHandle` |
| ✅ Portfolio fullscreen | Fullscreen / exit-fullscreen button added, matching DCA Backtest page |
| ✅ Backtest persistence | `POST/GET/DELETE /backtest/history` backend endpoints + frontend save-on-run + AI Chat sidebar history list |
| ✅ Todos scaffold removed | `TodosModule` and all `src/todos/` files deleted from backend |
| ✅ Floating chat removed | `FloatingAiChat` removed from `MainLayout` — UI now uses the sheet-based `AiAdvisorPanel` only |
| ✅ Duplicate welcome message | Fixed by initialising `useMcpChat` with the message instead of a `useEffect` |
| ✅ `parseActionLabel` logic | Rewrote parser to return `null` for comparisons/relative changes; chips now correctly route to chat or form |
| ✅ AI button style | `AiAdvisorTrigger` always renders `variant="outline"` — consistent with other header buttons |
| ✅ Sidebar tracking | `tracking-[0.2em]` → `tracking-wide` on "Load backtest" label |
| ✅ `TooltipProvider` missing | Added to `PortfolioPage` wrapper (was only in `DcaBacktestPage`) |

---

## Executive Summary

The codebase has solid architectural foundations — clean component hierarchy, well-structured routing, proper use of Context + React Query for state, and a consistent design system. However, several issues must be resolved before a production deployment:

| Status | Count |
|--------|-------|
| 🔴 Critical blockers | 2 |
| 🟠 High priority | 5 |
| 🟡 Medium priority | 9 |
| 🟢 Low / polish | 7 |

**The build is partially broken.** `CreateModelPage.tsx` still has TypeScript errors that prevent `vite build` from completing. The `PortfolioPage.tsx` errors from the initial review are resolved.

---

## Quick Reference — Critical Blockers

| # | Issue | File | Line | Status |
|---|-------|------|------|--------|
| B1 | React Hook Form generic type mismatch — **build fails** | `src/pages/ai-advisor/CreateModelPage.tsx` | 233, 247, 276, 297, 320 | 🔴 Open |
| ~~B2~~ | ~~Unused imports break strict TypeScript build~~ | ~~`src/pages/PortfolioPage.tsx`~~ | ~~19, 20, 55~~ | ✅ Fixed |
| B3 | Zero test coverage — no framework installed | — | — | 🔴 Open |

---

## 1. Project Structure & Organization

**Rating: ✅ Good**

Well-organised directory layout with clear separation of concerns.

```
src/
  assets/        icons only
  components/    shared UI (common/, ui/, mcp/, ai/, charts/)
  hooks/         custom hooks
  layouts/       MainLayout, AuthLayout
  lib/           API clients, query client, utilities
  pages/         route-level views
  providers/     ChatProvider, QueryProvider
  router/        route config + protected routes
```

**Issues:**
| Severity | File | Issue | Status |
|----------|------|-------|--------|
| 🟢 Low | `/old_button.tsx` | Dead file — 100+ lines never imported | Open |
| 🟢 Low | `src/assets/react.svg` | Unused asset | Open |
| 🟢 Low | `src/examples/` | Example components included in production bundle | Open |
| ✅ Done | `back-end/src/todos/` | Entire todos scaffold module | Deleted |
| ✅ Done | `src/components/FloatingAiChat.tsx` | Floating chat button removed from `MainLayout` | Removed from render tree |

**Actions:**
- Delete `/old_button.tsx` and `src/assets/react.svg`
- Move `src/examples/` outside `src/` or add a Vite exclude rule

---

## 2. TypeScript & Type Safety

**Rating: 🔴 Critical**

### Build-Breaking Errors

**`src/pages/ai-advisor/CreateModelPage.tsx` (lines 233, 247, 276, 297, 320)** 🔴 Still open

`useForm()` `Control` generic does not match the `FormField` component's expected type. All five `<FormField control={form.control}` usages fail with `TS2322`.

Fix: Ensure the form generic matches the Zod schema inferred type:
```ts
// Before
const form = useForm<FormValues>({ ... })

// After — explicitly pass the resolver type
const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
})
```

**`src/pages/PortfolioPage.tsx`** ✅ Resolved — `Button`, `cn`, `isFullscreen` now used by the added fullscreen feature.

### Pervasive `any` Usage (28 ESLint errors)

| File | Lines | Notes |
|------|-------|-------|
| `src/lib/api-client.ts` | 6, 8 | `data: any` in `ApiError` |
| `src/components/mcp/McpExecutionPanel.tsx` | 12, 15, 81 | Input and result types |
| `src/pages/dca-backtest/timeline-to-chart.ts` | 10–13 | Chart data transformation |
| `src/pages/SettingsPage.tsx` | 51, 89 | Form handlers |
| `src/pages/portfolio-backtest/PortfolioConfigCard.tsx` | 91 | Config shape |
| `src/hooks/use-auth.ts` | 129 | `as any` cast |
| `src/examples/components/UITestPage.tsx` | 580 | Example only |

**Actions:**
1. Fix `CreateModelPage` types — unblocks the build 🔴 Still open
2. ~~Fix `PortfolioPage` unused imports~~ ✅ Fixed
3. Replace `any` in `api-client.ts` with proper generics (`Record<string, unknown>` or typed response interfaces)
4. Type chart transformation inputs in `timeline-to-chart.ts`

---

## 3. Component Architecture & Reusability

**Rating: ✅ Good — minor violations**

Good use of composition, shadcn/ui primitives, and container/presentational separation. Protected route pattern is clean.

**React Fast Refresh Violations (10 ESLint errors)**

Components that export a variant constant alongside the component itself break HMR:

| File | Issue |
|------|-------|
| `src/components/ui/badge.tsx:112` | Exports `badgeVariants` + component |
| `src/components/ui/button.tsx:188` | Exports `buttonVariants` + component |
| `src/components/ui/form.tsx:167` | Mixed export |
| `src/components/ui/raw_button.tsx:64` | Mixed export |
| `src/components/ui/sidebar.tsx:609, 723` | Mixed export |
| `src/components/ui/tabs.tsx:91` | Mixed export |
| `src/providers/ChatProvider.tsx:79` | Exports constant + provider |

**Fix:** Move variant objects to a co-located `.constants.ts` file:
```ts
// button.constants.ts
export const buttonVariants = cva(...)

// button.tsx
export { buttonVariants } from './button.constants'
export const Button = React.forwardRef(...)
```

---

## 4. State Management

**Rating: ✅ Good**

- Context API correctly scoped to chat/session state
- React Query (TanStack v5) well-configured: 1-minute staleTime, smart retry logic
- `use-auth`, `use-ai-models`, `use-mcp-chat` are clean, well-abstracted hooks

**Issues: `setState` Inside `useEffect` Body (3 errors)**

| File | Lines | Impact |
|------|-------|--------|
| `src/pages/dca-backtest/PortfolioTrajectoryChart.tsx` | 79 | Cascading renders |
| `src/pages/dca-backtest/TradeHistoryTable.tsx` | 78, 83 | Cascading renders |

These cause two render cycles per update. Refactor to derived state or move setState into event callbacks.

---

## 5. API & Data Fetching

**Rating: 🟡 Good with gaps**

Clean abstraction in `src/lib/api-client.ts`. Bearer token auto-injected from localStorage. SSE streaming correctly implemented in `analyzeBacktestStream()`.

**Issues:**

| Severity | Issue | Location |
|----------|-------|----------|
| 🟠 Medium | No request timeout — fetch can hang indefinitely | `api-client.ts` |
| 🟡 Medium | `ApiError.data` typed as `any` | `api-client.ts:6` |
| 🟢 Low | `VITE_API_URL` fallback hardcoded in two places | `api-client.ts:44`, `ai-api.ts:185` |

**Actions:**
```ts
// Add AbortController timeout to every fetch
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 30_000)
fetch(url, { signal: controller.signal, ... })
```

---

## 6. Error Handling

**Rating: 🟡 Adequate — missing Error Boundary**

- `sonner` toasts in place for user-facing errors
- 401/429/503 codes handled in `FloatingAiChat`
- Zod validation on login/sign-up forms

**Gaps:**

| Severity | Issue |
|----------|-------|
| 🟠 High | No React Error Boundary — component crash = white screen |
| 🟡 Medium | No error logging service (Sentry, Datadog, etc.) |
| 🟡 Medium | Generic "Request failed" messages without context |
| 🟢 Low | `console.error` in `FloatingAiChat.tsx:64` — should use logging service |

**Add Error Boundary to `MainLayout`:**
```tsx
<ErrorBoundary fallback={<ErrorPage />}>
  <Outlet />
</ErrorBoundary>
```

---

## 7. Performance

**Rating: 🟡 Needs improvement**

**No route-based code splitting.** All pages load upfront. With heavy chart libraries (Recharts) and AI panels, this likely results in a large initial bundle.

```tsx
// Add to router.tsx
const DcaBacktestPage  = lazy(() => import('../pages/DcaBacktestPage'))
const PortfolioPage    = lazy(() => import('../pages/PortfolioPage'))
const AiAdvisorPage    = lazy(() => import('../pages/AiChatPage'))
```

**React Compiler Warnings (2)**

| File | Line | Note |
|------|------|------|
| `src/components/common/DataTable.tsx` | 61 | TanStack Table returns functions — not memoizable |
| `src/pages/dca-backtest/StrategyConfigCard.tsx` | 112 | `watch()` incompatible with compiler |

These are library limitations — no action required but they block full compiler optimization.

**Other:**
- No `vite-plugin-visualizer` to monitor bundle size
- No `React.memo` / `useMemo` on expensive chart computations

---

## 8. Accessibility (a11y)

**Rating: ✅ Good**

- `aria-hidden` on decorative icons (LoginPage, SignUpPage)
- `aria-label` on form controls
- Dark mode via `next-themes` with system preference support
- Semantic HTML in forms

**Minor gaps:**
- Chat message containers use `<div>` — consider `<article>` with `aria-live="polite"` for screen readers
- Some icon-only buttons may lack explicit `aria-label`

---

## 9. Security

**Rating: ✅ Good**

- Google OAuth 2.0 properly integrated
- No hardcoded credentials in codebase
- Zod input validation on auth forms
- `credentials: "include"` set correctly for cookies

**Considerations:**

| Severity | Issue |
|----------|-------|
| 🟡 Medium | `localStorage` for tokens is XSS-vulnerable — mitigate with a strict `Content-Security-Policy` header (server-side) |
| 🟡 Medium | Confirm backend validates Google OAuth `redirect_uri` to prevent open redirect |

---

## 10. Testing

**Rating: 🔴 Critical**

**Zero test files exist. No test framework is installed.**

There are no `.test.ts`, `.spec.ts`, or `__tests__` directories. `package.json` has no testing dependencies.

**Recommended setup:**
```bash
npm install -D vitest @testing-library/react @testing-library/user-event @vitest/coverage-v8 msw
```

**Minimum coverage targets:**
| Area | Target |
|------|--------|
| `src/lib/` (API clients, utils) | 80% |
| `src/hooks/` (use-auth, use-mcp-chat) | 70% |
| `src/components/` (critical forms) | 60% |
| `src/pages/` (happy path E2E) | Playwright |

---

## 11. Code Style & Linting

**Rating: 🟡 Fair — 33 violations**

ESLint config is present and well-configured with TypeScript + React Hooks + React Refresh plugins.

**Violation breakdown:**

| Rule | Count |
|------|-------|
| `@typescript-eslint/no-explicit-any` | 28 |
| `react-refresh/only-export-components` | 10 |
| `react-hooks/exhaustive-deps` | 2 |
| `react-hooks/rules-of-hooks` (purity) | 1 |
| `@typescript-eslint/no-empty-object-type` | 1 |

**Actions:**
- Add ESLint to pre-commit hook (Husky + lint-staged)
- Add Prettier for formatting consistency
- CI step: `npm run lint` fails the build on errors

---

## 12. Dependencies

**Rating: ✅ Healthy**

| Package | Version | Status |
|---------|---------|--------|
| React | 19.2.0 | Latest |
| TypeScript | 5.9.3 | Recent |
| Vite | 7.3.1 | Latest |
| TanStack Query | 5.90.21 | Stable |
| TanStack Table | 8.21.3 | Stable |
| Tailwind CSS | 4.2.0 | Latest |
| Recharts | — | Appropriate |
| Zod | — | Industry standard |

**Actions:**
- Run `npm audit` and resolve any vulnerabilities
- Set up Dependabot for automated security PRs
- Verify `tw-animate-css@1.4.0` is actively maintained

---

## 13. Environment Variables

**Rating: 🟡 Minimal**

Only one env var used (`VITE_API_URL`), hardcoded in two files as a fallback, and no `.env.example` exists.

**Actions:**
1. Create `.env.example`:
   ```env
   VITE_API_URL=http://localhost:8000/api/v1
   VITE_GOOGLE_CLIENT_ID=
   ```
2. Add startup validation:
   ```ts
   // src/lib/env.ts
   const requiredVars = ['VITE_API_URL'] as const
   for (const v of requiredVars) {
     if (!import.meta.env[v]) throw new Error(`Missing env var: ${v}`)
   }
   ```
3. Create `.env.production` with production values (do not commit real secrets)

---

## 14. Build Configuration

**Rating: 🟠 Partially broken**

`tsconfig.json` is correctly strict (`strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`). Path aliases aligned between tsconfig and vite.config.

**Build currently fails** due to:
1. `TS2322` type error in `CreateModelPage.tsx` (5 occurrences) — 🔴 Still open
2. ~~Unused `Button`, `cn` imports in `PortfolioPage.tsx`~~ — ✅ Fixed

**Actions:**
- Fix type errors above to restore a green build
- Add `vite-plugin-visualizer` to track bundle size over time
- Enable source maps for production error tracing:
  ```ts
  // vite.config.ts
  build: { sourcemap: true }
  ```

---

## 15. CSS & Styling

**Rating: ✅ Excellent**

- Tailwind CSS v4 with `@tailwindcss/vite` plugin — no PostCSS boilerplate needed
- HSL CSS variables for theming — supports dark mode without class conflicts
- `cn()` (clsx + tailwind-merge) correctly applied throughout
- Semantic color naming: `primary`, `secondary`, `destructive`, `success`, `warning`, `info`

**Minor:**
- `src/App.css` contains unused logo-animation styles — clean up
- No Stylelint configuration for Tailwind class ordering

---

## 16. Routing

**Rating: ✅ Good**

React Router v6 with nested layouts, protected routes, and 404/403 fallbacks. Route `handle` objects provide breadcrumb data cleanly.

**Issues:**
- No route-based code splitting (see Performance section)
- `/users` route is a placeholder stub
- Role-based route guards exist (403 page) but guard logic not fully wired

---

## 17. Dead Code & Unused Imports

**Rating: 🟡 Minor**

| File | Issue | Status |
|------|-------|--------|
| `/old_button.tsx` | Entire file unused | Open |
| ~~`src/pages/PortfolioPage.tsx:19-20`~~ | ~~`Button`, `cn` imported but never used~~ | ✅ Fixed — used by fullscreen feature |
| ~~`src/pages/PortfolioPage.tsx:55`~~ | ~~`isFullscreen`, `setIsFullscreen` state never used~~ | ✅ Fixed — fullscreen now implemented |
| `src/pages/dca-backtest/TradeHistoryTable.tsx:62` | `_portfolioSymbols` declared but not used | Open |
| `src/assets/react.svg` | Not imported anywhere | Open |

---

## 18. Bugs & Anti-Patterns

### 🔴 `Math.random()` in Render (`src/components/ui/sidebar.tsx:609`)

```tsx
// WRONG — random value changes on every invocation
const width = React.useMemo(() => {
  return `${Math.floor(Math.random() * 40) + 50}%`
}, [])
```

`useMemo` with an empty dep array runs once per component mount, but skeletons can remount. Move to `useState` initializer:
```tsx
const [width] = useState(() => `${Math.floor(Math.random() * 40) + 50}%`)
```

### 🟠 `setState` Synchronously Inside `useEffect`

```tsx
// src/pages/dca-backtest/PortfolioTrajectoryChart.tsx:79
useEffect(() => {
  if (!hasAssetBreakdown) {
    setSelectedSeries(ALL_SERIES_VALUE) // triggers second render cycle
    return
  }
}, [hasAssetBreakdown])
```

Replace with derived state:
```tsx
const selectedSeries = hasAssetBreakdown ? internalSeries : ALL_SERIES_VALUE
```

### 🟡 Missing `useEffect` Dependencies

| File | Line | Missing Dep |
|------|------|-------------|
| `src/components/ai/AiAdvisorPanel.tsx` | 113 | `setMessages` |
| `src/components/common/SearchInput.tsx` | 22 | `localValue` |

### 🟢 Empty Interface

```tsx
// src/components/common/PageContainer.tsx:4
interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {}
// Use the parent type directly or add at least one prop
```

---

## Prioritised Action Plan

### Phase 1 — Unblock Production (Week 1)

- [ ] Fix `CreateModelPage.tsx` React Hook Form type errors → **build passes** 🔴
- [x] ~~Fix unused imports in `PortfolioPage.tsx`~~ ✅
- [ ] Fix `Math.random()` in `sidebar.tsx:609`
- [ ] Add Error Boundary to `MainLayout`
- [ ] Add environment variable validation on startup
- [ ] Delete `/old_button.tsx` and `src/assets/react.svg`

**Also completed this session (not in original plan):**
- [x] Backtest history persistence — MongoDB schema + API endpoints + frontend save/load ✅
- [x] Portfolio AI wiring — `onSuggestedAction` connected via `forwardRef` ✅
- [x] Portfolio fullscreen button — parity with DCA Backtest page ✅
- [x] `TodosModule` scaffold removed from backend ✅
- [x] `FloatingAiChat` removed from `MainLayout` ✅
- [x] Duplicate AI welcome message fixed ✅
- [x] `parseActionLabel` rewritten — comparison/relative chips now route to chat instead of silently mutating the form ✅
- [x] `TooltipProvider` wrapper added to `PortfolioPage` ✅

### Phase 2 — Quality (Week 2)

- [ ] Install Vitest + Testing Library, write tests for `use-auth`, `use-mcp-chat`, API client
- [ ] Replace all `any` types in `src/lib/` and `src/hooks/`
- [ ] Fix `setState in useEffect` in backtest charts
- [ ] Add request timeout to `api-client.ts`
- [ ] Add Husky + lint-staged pre-commit hooks
- [ ] Implement route-based code splitting for heavy pages

### Phase 3 — Polish (Week 3+)

- [ ] Set up Sentry (or similar) for production error tracking
- [ ] Add `vite-plugin-visualizer` for bundle monitoring
- [ ] Enable production source maps
- [ ] Create `.env.example` and environment-specific configs
- [ ] Fix React Fast Refresh violations in `src/components/ui/`
- [ ] Set up Dependabot for dependency security updates
- [ ] Lighthouse performance audit after code splitting

---

## Score Summary

| Category | Score (v1) | Score (v2) | Priority |
|----------|-----------|-----------|----------|
| Project Structure | ✅ 9/10 | ✅ 9/10 | — |
| TypeScript Safety | 🔴 4/10 | 🟠 5/10 | Critical |
| Component Architecture | ✅ 8/10 | ✅ 9/10 | Low |
| State Management | 🟡 7/10 | ✅ 8/10 | Medium |
| API / Data Fetching | 🟡 7/10 | 🟡 7/10 | Medium |
| Error Handling | 🟡 6/10 | 🟡 6/10 | High |
| Performance | 🟡 5/10 | 🟡 5/10 | Medium |
| Accessibility | ✅ 8/10 | ✅ 8/10 | Low |
| Security | ✅ 8/10 | ✅ 8/10 | Low |
| Testing | 🔴 0/10 | 🔴 0/10 | Critical |
| Code Style | 🟡 6/10 | 🟡 6/10 | Medium |
| Dependencies | ✅ 9/10 | ✅ 9/10 | — |
| Environment Config | 🟡 5/10 | 🟡 5/10 | Medium |
| Build Config | 🔴 0/10 | 🟠 3/10 | Critical |
| CSS / Styling | ✅ 9/10 | ✅ 9/10 | — |
| Routing | ✅ 8/10 | ✅ 8/10 | Low |
| **Overall** | **6.3 / 10** | **6.6 / 10** | — |

> Score improvements: TypeScript Safety (+1 — B2 resolved), Component Architecture (+1 — portfolio AI wiring + fullscreen parity), State Management (+1 — duplicate message bug + parseActionLabel fixed + persistence added), Build Config (+3 — one of two build errors resolved).
