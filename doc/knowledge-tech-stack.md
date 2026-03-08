# Trading Lab – Knowledge & Tech Stack

A **beginner-focused** guide to each technology used in this project. For each tech we explain what it is, why we use it, and where to learn more (with direct links).

**Use this doc when:** you are new to a tool, need a quick refresher, or want official docs and tutorials to go deeper.

---

## How to use this doc

- **Backend** work → read Node.js, TypeScript, NestJS, MongoDB/Mongoose, then auth (JWT, Passport, bcrypt) and validation (class-validator).
- **Frontend** work → read Node.js, TypeScript, React, Vite, then forms (react-hook-form, Zod), styling (Tailwind), and data (TanStack Query).
- **Full-stack / DevOps** → add Git, Docker, and API docs (Swagger).

---

## 1. Runtime & language

### Node.js

**What it is:** A JavaScript runtime that runs JS (and TypeScript, after compilation) **outside the browser**—on servers, CLIs, and in our case the NestJS backend.

**Why we use it:** The Trading Lab API runs on Node.js. You need it installed to run `npm install`, `npm run start:dev`, and all backend scripts.

**Beginner focus:**

- You run `.js` (or compiled `.ts`) files with `node path/to/file.js`.
- `npm` (Node Package Manager) comes with Node; it installs dependencies and runs scripts from `package.json`.
- The backend is a long-running process that listens on a port (e.g. 8000) and responds to HTTP requests.

**References:**

- [Node.js official site](https://nodejs.org/)
- [Node.js – About Node.js](https://nodejs.org/en/about)
- [npm docs – What is npm?](https://docs.npmjs.com/about-npm)

---

### TypeScript

**What it is:** A **typed** superset of JavaScript. You write `.ts` files; they compile to `.js`. Types help catch bugs early and improve editor support.

**Why we use it:** Both the backend (NestJS) and frontend (React + Vite) use TypeScript for safer refactors and clearer APIs.

**Beginner focus:**

- **Types:** variables, parameters, and return values can be annotated (e.g. `const name: string`, `function add(a: number, b: number): number`).
- **Interfaces / types:** describe the shape of objects (e.g. `User`, `BacktestResult`).
- **Strict mode:** our `tsconfig.json` enables strict checks; fix type errors instead of using `any` when possible.

**References:**

- [TypeScript official site](https://www.typescriptlang.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [TypeScript for the New Programmer](https://www.typescriptlang.org/docs/handbook/typescript-from-scratch.html) (beginner path)

---

## 2. Backend

### NestJS

**What it is:** A **backend framework** for Node.js, built with TypeScript. It uses modules, dependency injection, decorators, and a clear structure (controllers, services, guards, interceptors).

**Why we use it:** It gives us a consistent way to build the API (auth, backtest, users), integrate MongoDB and Passport, and document endpoints with Swagger.

**Beginner focus:**

- **Modules:** group related code (e.g. `AuthModule`, `TodosModule`). Import/export what other modules need.
- **Controllers:** handle HTTP routes (e.g. `POST /auth/login`). Use decorators like `@Get()`, `@Post()`, `@Body()`, `@Param()`.
- **Services:** hold business logic. Injected into controllers; don’t put heavy logic inside controllers.
- **Guards:** run before a route (e.g. JWT guard checks the token and attaches the user).
- **Pipes:** validate or transform input (e.g. `ValidationPipe` with class-validator DTOs).
- **Interceptors:** wrap request/response (e.g. logging, mapping the response shape).

**References:**

- [NestJS official site](https://nestjs.com/)
- [NestJS – First steps](https://docs.nestjs.com/first-steps)
- [NestJS – Overview](https://docs.nestjs.com/)
- [NestJS – Controllers](https://docs.nestjs.com/controllers)
- [NestJS – Providers / Services](https://docs.nestjs.com/providers)
- [NestJS – Validation](https://docs.nestjs.com/techniques/validation)

---

### Express (via NestJS)

**What it is:** A minimal **HTTP server** library for Node.js. NestJS uses Express under the hood by default (we don’t write Express directly; Nest wraps it).

**Why it matters:** When we talk about “request”, “response”, “middleware”, or “cookie”, we’re in the Express/Nest world. Understanding that the backend is an HTTP server helps with auth (cookies, headers) and middleware order.

**References:**

- [Express – Hello World](https://expressjs.com/en/starter/hello-world.html)
- [Express – Guide](https://expressjs.com/en/guide/routing.html)

---

## 3. Data & persistence

### MongoDB

**What it is:** A **document database** (NoSQL). Data is stored as **documents** (JSON-like objects) in **collections** (like tables). No fixed schema required.

**Why we use it:** We store users, (later) backtest configs, and other app data. MongoDB fits well with NestJS and Mongoose and allows flexible schemas.

**Beginner focus:**

- **Database → collections → documents.** One “row” is one document (e.g. one user, one todo).
- **No SQL;** you query by field values, filters, and operators (e.g. `findOne({ email })`).
- We use **Mongoose** (see below) to define schemas and talk to MongoDB from Node.

**References:**

- [MongoDB – What is MongoDB?](https://www.mongodb.com/docs/manual/introduction/)
- [MongoDB – Getting started](https://www.mongodb.com/docs/manual/tutorial/getting-started/)
- [MongoDB University – Free courses](https://learn.mongodb.com/)

---

### Mongoose

**What it is:** An **ODM** (Object-Document Mapper) for MongoDB and Node.js. You define **schemas** and **models**, then use methods like `find`, `findOne`, `create`, `save`, `deleteOne`.

**Why we use it:** In NestJS we use `@nestjs/mongoose` and Mongoose schemas to define User, Todo, etc., validate shape, and run queries without writing raw MongoDB queries.

**Beginner focus:**

- **Schema:** defines fields and types (e.g. `email: String`, `passwordHash: String`, `createdAt: Date`).
- **Model:** the object you use to query (e.g. `UserModel.find({ deletedAt: null })`).
- **Documents:** instances with methods like `.save()`, `.deleteOne()`.
- **Connections:** we set `MONGODB_URI` in `.env`; the app connects at startup.

**References:**

- [Mongoose – Quick start](https://mongoosejs.com/docs/index.html)
- [Mongoose – Schemas](https://mongoosejs.com/docs/guide.html)
- [Mongoose – Queries](https://mongoosejs.com/docs/queries.html)
- [NestJS – MongoDB](https://docs.nestjs.com/techniques/mongodb)

---

### Redis (optional)

**What it is:** An in-memory **key-value store**. Often used for caching and sessions.

**Why we use it:** In this project Redis is optional (e.g. for caching price data or session data). We use `@nestjs/cache-manager` and `cache-manager-redis-yet` when Redis is enabled.

**Beginner focus:**

- **Key-value:** you set and get by key (e.g. `cache.set('prices:BTC', data)` then `cache.get('prices:BTC')`).
- **Fast** because data lives in memory; good for temporary data (cache, rate limits).

**References:**

- [Redis – Introduction](https://redis.io/docs/getting-started/)
- [NestJS – Caching](https://docs.nestjs.com/techniques/caching)

---

## 4. Authentication & security

### JWT (JSON Web Tokens)

**What it is:** A standard way to represent **claims** (e.g. user id, email) as a signed token string. The client sends the token (e.g. in the `Authorization: Bearer <token>` header); the server verifies the signature and reads the payload.

**Why we use it:** We issue a short-lived **access token** (JWT) after login/register/refresh. Protected routes validate this token and attach the user to the request.

**Beginner focus:**

- **Access token:** short-lived (e.g. 15 min). Sent with each API request; server validates it.
- **Refresh token:** long-lived, stored in an HTTP-only cookie; used to get a new access token without re-login.
- **Never put secrets in the token payload;** it’s base64-encoded, not encrypted. Sign with a secret so the server can detect tampering.

**References:**

- [jwt.io – Introduction](https://jwt.io/introduction)
- [NestJS – JWT](https://docs.nestjs.com/security/authentication#jwt-functionality)
- [NestJS – Authentication](https://docs.nestjs.com/security/authentication)

---

### Passport

**What it is:** **Authentication middleware** for Node.js. You plug in “strategies” (e.g. JWT, Google OAuth); Passport runs them and attaches the user to the request.

**Why we use it:** We use `passport-jwt` to validate the Bearer token and load the user. NestJS wraps this in guards (e.g. `JwtAuthGuard`).

**Beginner focus:**

- **Strategy:** defines “how” we authenticate (e.g. extract JWT from header, verify, find user).
- **Guard:** in NestJS, the guard calls Passport; if the strategy succeeds, `request.user` is set.
- **Session vs JWT:** we use **stateless JWT** (no server-side session store for the access token).

**References:**

- [Passport.js – Official site](https://www.passportjs.org/)
- [Passport – JWT strategy](https://www.passportjs.org/packages/passport-jwt/)
- [NestJS – Passport](https://docs.nestjs.com/security/authentication#implementing-passport-strategies)

---

### bcrypt

**What it is:** A library to **hash** passwords (one-way). You hash on register and **compare** the plain password with the hash on login. Never store plain passwords.

**Why we use it:** Industry-standard, slow-by-design hashing so brute-force is expensive. We use it in the auth service for register and login.

**Beginner focus:**

- **Hash:** same password always gives the same hash (with salt), but you can’t get the password back from the hash.
- **Compare:** `bcrypt.compare(plainPassword, hash)` returns true/false.
- **Salt:** bcrypt handles salting internally; you only choose a “rounds” (cost) factor.

**References:**

- [npm – bcrypt](https://www.npmjs.com/package/bcrypt)
- [NestJS – Hashing (in Security doc)](https://docs.nestjs.com/security/authentication#implementing-the-sign-in-endpoint)

---

## 5. Validation & API docs

### class-validator & class-transformer

**What it is:** **class-validator** adds validation decorators to classes (e.g. `@IsEmail()`, `@IsString()`, `@Min(0)`). **class-transformer** turns plain objects into class instances and can exclude properties (e.g. strip `passwordHash` from responses).

**Why we use it:** Our DTOs (Data Transfer Objects) are classes with these decorators. NestJS’s `ValidationPipe` runs validation and returns 400 with clear messages when input is invalid.

**Beginner focus:**

- Define a **class** with properties and decorators (e.g. `LoginDto` with `email`, `password`).
- Use `@IsOptional()`, `@IsNumber()`, `@Min()`, `@MaxLength()` etc. to describe rules.
- In controllers, use `@Body() dto: LoginDto`; the pipe validates and can transform (e.g. trim strings).

**References:**

- [class-validator – GitHub](https://github.com/typestack/class-validator)
- [class-validator – Usage](https://github.com/typestack/class-validator#usage)
- [class-transformer – GitHub](https://github.com/typestack/class-transformer)
- [NestJS – Validation](https://docs.nestjs.com/techniques/validation)

---

### Swagger (OpenAPI)

**What it is:** A way to **document** your API (endpoints, request/response bodies, auth). Swagger UI gives a web page where you can try endpoints (e.g. add Bearer token and call GET /todos/:id).

**Why we use it:** We use `@nestjs/swagger` so all auth, backtest, and other endpoints are documented and testable from the browser. Great for beginners and frontend devs.

**Beginner focus:**

- **Decorators:** `@ApiTags()`, `@ApiOperation()`, `@ApiBody()`, `@ApiResponse()`, `@ApiBearerAuth()` describe the API.
- **Swagger UI:** usually at something like `http://localhost:8000/api/docs`. Use “Authorize” to set the JWT, then hit protected routes.

**References:**

- [Swagger/OpenAPI – Introduction](https://swagger.io/docs/specification/about/)
- [NestJS – OpenAPI (Swagger)](https://docs.nestjs.com/openapi/introduction)

---

## 6. Frontend

### React

**What it is:** A **UI library** for building interfaces with components. You describe the UI as a function of state and props; React updates the DOM when state or props change.

**Why we use it:** The Trading Lab frontend is a React app (login, backtest form, charts, etc.). We use hooks (`useState`, `useEffect`, custom hooks like `useAuth`).

**Beginner focus:**

- **Components:** functions (or classes) that return JSX. Props in, UI out.
- **State:** `useState`; updates trigger re-renders.
- **Effects:** `useEffect` for side effects (fetch, subscribe, focus).
- **Lists:** use `key` when rendering lists so React can reconcile correctly.

**References:**

- [React – Home](https://react.dev/)
- [React – Learn React](https://react.dev/learn) (step-by-step)
- [React – Hooks](https://react.dev/reference/react)

---

### Vite

**What it is:** A **build tool** and dev server for frontend apps. It bundles your code, supports TypeScript and JSX, and provides fast HMR (Hot Module Replacement).

**Why we use it:** The frontend runs and builds with Vite (`npm run dev`, `npm run build`). You don’t need to configure much; it works with React and TypeScript out of the box.

**Beginner focus:**

- **Dev:** `vite` serves the app and watches files; edits show up without full reload when possible.
- **Build:** `vite build` produces static files (HTML, JS, CSS) for deployment.
- **Config:** `vite.config.ts` for aliases, env, proxy to the backend API if needed.

**References:**

- [Vite – Getting started](https://vite.dev/guide/)
- [Vite – Why Vite](https://vite.dev/guide/why.html)

---

### React Hook Form

**What it is:** A library for **forms** in React. It keeps form state, validation, and submission in one place with minimal re-renders.

**Why we use it:** We use it for login, register, backtest config, and other forms. Combined with Zod (via `@hookform/resolvers`) we get schema-based validation.

**Beginner focus:**

- **register:** connect inputs to the form state (`register('email')`).
- **handleSubmit:** run validation and your submit function.
- **errors:** object with per-field errors after validation.
- **Resolver:** Zod (or other) resolver runs your schema and fills `errors`.

**References:**

- [React Hook Form – Home](https://react-hook-form.com/)
- [React Hook Form – Get started](https://react-hook-form.com/get-started)
- [React Hook Form – Resolvers (Zod)](https://react-hook-form.com/docs/useform/resolvers)

---

### Zod

**What it is:** A **schema** library for TypeScript. You define a schema (shape + validation); Zod parses and validates data and infers TypeScript types.

**Why we use it:** On the frontend we use Zod with React Hook Form for form validation. On the backend we could use it too; this project uses class-validator for DTOs, but Zod is a common alternative.

**Beginner focus:**

- **Schema:** e.g. `z.object({ email: z.string().email(), password: z.string().min(8) })`.
- **Parse:** `schema.parse(data)` throws if invalid; returns typed data if valid.
- **SafeParse:** returns `{ success, data?, error? }` so you can handle errors without try/catch.
- **Infer type:** `z.infer<typeof schema>` gives you the TypeScript type.

**References:**

- [Zod – GitHub](https://github.com/colinhacks/zod)
- [Zod – Introduction](https://zod.dev/?id=introduction)

---

### TanStack Query (React Query)

**What it is:** A library for **server state**: fetching, caching, and updating data from the API. It handles loading/error states, refetching, and cache invalidation.

**Why we use it:** We use it to call the backend (e.g. backtest run, user profile), show loading/error in the UI, and refetch when the window refocuses or after a mutation.

**Beginner focus:**

- **useQuery:** fetch data for a key (e.g. `['backtest', id]`). You get `data`, `isLoading`, `error`, `refetch`.
- **useMutation:** run a request that changes data (e.g. POST backtest). You get `mutate`, `isPending`, then invalidate queries so lists/details update.
- **Query keys:** uniquely identify what you’re fetching; invalidate them when data changes.

**References:**

- [TanStack Query – Overview](https://tanstack.com/query/latest/docs/framework/react/overview)
- [TanStack Query – Quick start](https://tanstack.com/query/latest/docs/framework/react/quick-start)

---

### Tailwind CSS

**What it is:** A **utility-first** CSS framework. You style by adding classes (e.g. `flex`, `p-4`, `text-blue-600`) instead of writing separate CSS files.

**Why we use it:** The frontend uses Tailwind (and Tailwind-based components) for layout, spacing, colors, and responsiveness. Fast to prototype and consistent.

**Beginner focus:**

- **Utilities:** one class ≈ one style. Combine many classes on one element.
- **Responsive:** prefixes like `md:`, `lg:` (e.g. `md:flex`).
- **Dark mode:** we use `next-themes`; Tailwind’s `dark:` prefix for dark styles.
- **No custom CSS required** for most UI; use the design system (and shadcn if present).

**References:**

- [Tailwind CSS – Docs](https://tailwindcss.com/docs)
- [Tailwind CSS – Utility-first](https://tailwindcss.com/docs/utility-first)

---

### React Router

**What it is:** A library for **routing** in React: mapping URLs to components (e.g. `/login` → LoginPage, `/dashboard` → Dashboard).

**Why we use it:** We use it for login, signup, dashboard, backtest, and protected routes. It supports nested routes and programmatic navigation.

**Beginner focus:**

- **Routes:** define path → element (component).
- **Link / useNavigate:** navigate without full page reload.
- **Params:** e.g. `/backtest/:id` and `useParams()` to read `id`.
- **Protected route:** render redirect to login if not authenticated.

**References:**

- [React Router – Tutorial](https://reactrouter.com/en/main/start/tutorial)
- [React Router – Overview](https://reactrouter.com/en/main)

---

### Charts (Recharts – planned)

**What it is:** A **charting** library for React. Declarative components (e.g. `<LineChart>`, `<Line>`, `<XAxis>`) with good defaults.

**Why we use it:** In the task list we use “e.g. Recharts” for the equity/growth chart and pie chart. You may add it to the frontend when implementing L1-FE-3, L2-FE-2, etc.

**References:**

- [Recharts – Getting started](https://recharts.org/en-US/guide/getting-started)
- [Recharts – Examples](https://recharts.org/en-US/examples)

---

## 7. DevOps & tools

### Git

**What it is:** **Version control**: track changes, branches, and history. Essential for teamwork and deployment.

**Why we use it:** All code is in Git; we follow the rules in [git-rules.md](git-rules.md) (branches, commits, PRs).

**Beginner focus:**

- **Branch:** work on a copy of the code (e.g. `feature/L0-BE-1-user-entity`).
- **Commit:** save a snapshot with a message.
- **Push / pull:** sync with the remote (e.g. GitHub). Open a PR to merge into `develop`.

**References:**

- [Git – Documentation](https://git-scm.com/doc)
- [Git – Book (free)](https://git-scm.com/book/en/v2)
- [GitHub – Guides](https://docs.github.com/en/get-started)

---

### Docker

**What it is:** **Containers**: package the app and its environment (Node version, OS, etc.) so it runs the same everywhere.

**Why we use it:** We use (or will use) Docker and docker-compose for the back-end, MongoDB, and optional Redis so anyone can run the stack with one command.

**Beginner focus:**

- **Image:** blueprint (e.g. Node 20 + our app).
- **Container:** running instance of an image.
- **Compose:** define multiple services (api, mongodb, redis) and start them together.

**References:**

- [Docker – Get started](https://docs.docker.com/get-started/)
- [Docker – What is a container?](https://www.docker.com/resources/what-container/)
- [Docker Compose – Overview](https://docs.docker.com/compose/)

---

### ESLint & Prettier

**What it is:** **ESLint** finds bugs and style issues (e.g. unused variables, React hooks rules). **Prettier** formats code (indent, quotes, line length).

**Why we use it:** Both backend and frontend use them so code stays consistent and many issues are caught before commit or review.

**Beginner focus:**

- Run `npm run lint` (and fix with `--fix` when safe). Fix remaining issues by hand.
- Prettier runs on save or via `npm run format` (if configured). Don’t fight the formatter; adjust config if the team agrees.

**References:**

- [ESLint – Getting started](https://eslint.org/docs/latest/use/getting-started)
- [Prettier – What is Prettier?](https://prettier.io/docs/en/)

---

## 8. Quick reference table

| Area        | Technology        | Official / main link |
|------------|-------------------|-----------------------|
| Runtime    | Node.js           | https://nodejs.org/ |
| Language   | TypeScript        | https://www.typescriptlang.org/docs/ |
| Backend    | NestJS            | https://docs.nestjs.com/ |
| Database   | MongoDB           | https://www.mongodb.com/docs/ |
| ODM        | Mongoose          | https://mongoosejs.com/docs/ |
| Auth       | JWT               | https://jwt.io/introduction |
| Auth       | Passport          | https://www.passportjs.org/ |
| Passwords  | bcrypt            | https://www.npmjs.com/package/bcrypt |
| Validation | class-validator   | https://github.com/typestack/class-validator |
| API docs   | Swagger (NestJS)  | https://docs.nestjs.com/openapi/introduction |
| Frontend   | React             | https://react.dev/learn |
| Build      | Vite              | https://vite.dev/guide/ |
| Forms      | React Hook Form   | https://react-hook-form.com/get-started |
| Schemas    | Zod               | https://zod.dev/ |
| Data       | TanStack Query    | https://tanstack.com/query/latest |
| Styling    | Tailwind CSS      | https://tailwindcss.com/docs |
| Routing    | React Router      | https://reactrouter.com/en/main |
| Charts     | Recharts          | https://recharts.org/ |
| DevOps     | Git               | https://git-scm.com/doc |
| DevOps     | Docker            | https://docs.docker.com/get-started/ |

---
