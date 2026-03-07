# Tech Prep AI - Frontend Architecture

## 1. Tech Stack Overview
- **Build Tool**: Vite
- **Framework**: React 18+ (Strict Mode)
- **Language**: TypeScript (Strict)
- **Routing**: React Router v6
- **UI Components**: shadcn/ui (Tailwind CSS)
- **Data Fetching/State**: @tanstack/react-query v5
- **Form Handling**: react-hook-form
- **Validation**: zod

## 2. Core Architectural Principles
- **Strict Separation of Concerns**: Pages are presentational. All API calls stay in `services/`. All orchestration & React Query logic stays in `hooks/`.
- **Flat Feature Modules**: Business logic is separated logically by domain in `hooks/`, `services/`, and `schemas/`, but visually grouped in nested folders within `routes/`.
- **shadcn/ui Purity**: Shadcn components remain isolated in `components/ui/` and should not contain complex application business logic.
- **Micro-Frontend Ready**: The isolated nature of `routes/` enables easy extraction into micro-frontends later.

## 3. Directory Structure

```text
src/
  ├── app/                  # Application bootstrap (main.tsx, App.tsx)
  ├── components/           
  │   ├── ui/               # Raw shadcn components
  │   └── common/           # Shared reusable UI (Loaders, Empty States, Dialogs)
  ├── routes/               # Routing layer (Pages, Layouts, nested routing)
  │   ├── ai-setup/         # Example Module: AI Setup
  │   └── users/            # Example Module: Users
  ├── hooks/                # React Query hooks (useUsersQuery, useUpdateMutation)
  ├── services/             # API layer (axios/fetch wrappers, no UI logic)
  ├── schemas/              # Zod validation schemas
  ├── types/                # TypeScript interfaces and types
  ├── providers/            # React Context Providers (QueryProvider, ThemeProvider)
  ├── router/               # React Router v6 configuration (router.tsx)
  └── lib/                  # Utility functions and constants
```

## 4. Responsibility Matrix

| Directory | Responsibility | Rules |
| :--- | :--- | :--- |
| `routes/` | Layouts, Presentational Pages | NO `fetch`/API calls. Use custom hooks. |
| `hooks/` | React Query integrations | Expose clean data & mutation functions to routes. |
| `services/` | HTTP requests | Pure async functions. NO React hooks inside. |
| `schemas/` | Form / Payload validation | Use Zod. Share with backend DTO structure conceptually. |
| `components/` | Reusable UI | Dumb components. Data passed via props. |
