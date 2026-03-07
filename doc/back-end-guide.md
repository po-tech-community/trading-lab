# Back-end Developer Guide (NestJS)

This guide helps developers work in the `back-end/` folder: project structure, how to create modules, and where to implement features. For task lists and APIs, see [developer-tasks.md](developer-tasks.md).

---

## 1. Ports and URLs

| App        | Port | Base URL                    | Swagger (if applicable)     |
|-----------|------|-----------------------------|-----------------------------|
| Front-end | 3000 | `http://localhost:3000`     | —                           |
| Back-end  | 8000 | `http://localhost:8000/api/v1` | `http://localhost:8000/api/docs` |

All back-end routes are prefixed with `api/v1`. Configure the front-end to call `http://localhost:8000/api/v1/...`.

---

## 2. Project Structure

```
back-end/
├── .env                    # Local config (PORT=8000, MONGODB_URI, REDIS_*). Not committed.
├── .env.example            # Template for .env; copy to .env and fill values.
├── docker-compose.yml      # MongoDB + Redis for local dev (docker compose up -d).
├── nest-cli.json          # Nest CLI config.
├── package.json           # Dependencies and scripts.
├── tsconfig.json          # TypeScript config.
├── tsconfig.build.json    # Build-time TS config.
├── src/
│   ├── main.ts            # Bootstrap: global prefix, ValidationPipe, Swagger, listen(8000).
│   ├── app.module.ts      # Root module: Config, Mongoose, Cache (Redis), AuthModule, UsersModule.
│   ├── app.controller.ts  # Health/root routes (/, /health); Swagger tag "health".
│   ├── app.service.ts     # getHello(), getHealth().
│   ├── common/            # Shared: guards, decorators, middleware, interceptors.
│   │   ├── decorators/public.decorator.ts, current-user.decorator.ts
│   │   ├── guards/jwt-auth.guard.ts
│   │   ├── middleware/logger.middleware.ts
│   │   └── interceptors/logging.interceptor.ts
│   ├── auth/              # Auth stub: register, login, JWT (AuthService, JwtStrategy).
│   │   ├── dto/register.dto.ts, login.dto.ts
│   │   ├── strategies/jwt.strategy.ts
│   │   ├── auth.controller.ts, auth.service.ts, auth.module.ts
│   ├── todos/             # Sample CRUD module (reference for creating new modules).
│   │   ├── dto/           # create-todo.dto.ts, update-todo.dto.ts, list-todo-query.dto.ts
│   │   ├── schemas/todo.schema.ts
│   │   ├── todos.controller.ts
│   │   ├── todos.service.ts
│   │   └── todos.module.ts
│   └── users/             # Level 0 – Users (template only; implement L0-BE-*, L0-FE-*).
│       └── users.module.ts
└── test/                  # E2E tests.
```

**Sample module (reference):** `todos/` – full CRUD, Mongoose schema, DTOs with validation, list + get-one, public vs protected routes (JwtAuthGuard + @Public), Swagger. Use it as a template for new modules.

**Planned modules (add when implementing tasks):**

- `auth/` – register, login, JWT (Level 0).
- `users/` – user entity, `/users/me`, profile (Level 0).
- `backtest/` – price service, calculation engine, `POST /backtest/run` (Level 1), portfolio and triggers (Level 2–3).
- `ai/` – OpenAI, `POST /ai/analyze` (Level 4).

---

## 3. Request Pipeline (Middleware → Guard → Interceptor → Pipe → Controller)

Every API request passes through this order. Students: use this when adding auth or logging.

| Order | Layer | What runs | Example in this project |
|-------|--------|-----------|--------------------------|
| 1 | **Middleware** | Runs before the route handler; can reject or call `next()`. | [LoggerMiddleware](back-end/src/common/middleware/logger.middleware.ts) – logs "Incoming GET /api/v1/..." |
| 2 | **Guard** | Determines if the request is allowed (e.g. JWT valid). | [JwtAuthGuard](back-end/src/common/guards/jwt-auth.guard.ts) – validates Bearer token via [JwtStrategy](back-end/src/auth/strategies/jwt.strategy.ts); skip if route has `@Public()`. |
| 3 | **Interceptor** | Wraps request/response; can log, transform, or measure time. | [LoggingInterceptor](back-end/src/common/interceptors/logging.interceptor.ts) – logs request (method, url, body with passwords redacted) and response (status, duration). |
| 4 | **Pipe** | Validates/transforms input (body, query, param). | Global `ValidationPipe` in [main.ts](back-end/src/main.ts) – validates DTOs (class-validator). |
| 5 | **Controller** | Handles the request and returns the response. | e.g. [AuthController](back-end/src/auth/auth.controller.ts), [TodosController](back-end/src/todos/todos.controller.ts). |

**Auth stub for students:** [auth/](back-end/src/auth/) has register, login (issue JWT), and [JwtStrategy](back-end/src/auth/strategies/jwt.strategy.ts) validates the token. Protected routes use `@UseGuards(JwtAuthGuard)`; public routes use `@Public()`. Replace in-memory user store in [AuthService](back-end/src/auth/auth.service.ts) with MongoDB User when implementing L0.

**Why Bearer might still return 401:** Any module that uses `JwtAuthGuard` must **import AuthModule** so the JWT strategy is available. Example: [TodosModule](back-end/src/todos/todos.module.ts) imports `AuthModule`. Without that, the guard cannot validate the token.

**Get current user in controllers:** Use the `@CurrentUser()` parameter decorator to read `request.user` (set by JwtStrategy). Example: `create(@Body() dto: CreateTodoDto, @CurrentUser() user: JwtPayload)`. Optional: `@CurrentUser('email')` returns only `user.email`. See [current-user.decorator.ts](back-end/src/common/decorators/current-user.decorator.ts).

**Logs you will see:** For each API call, first `[Middleware] Incoming ...`, then `[Req] ... body=...`, then `[Res] ... status duration`.

---

## 4. Key Files

| File | Purpose |
|------|--------|
| `src/main.ts` | Creates app, sets global prefix `api/v1`, ValidationPipe, Swagger at `/api/docs`, listens on `PORT` (default 8000). |
| `src/app.module.ts` | Imports ConfigModule (global), MongooseModule (MongoDB), CacheModule (Redis), and feature modules. Add new modules here. |
| `.env` | `PORT`, `MONGODB_URI`, `REDIS_HOST`, `REDIS_PORT`, etc. Required for run. |
| `docker-compose.yml` | Starts MongoDB (27017) and Redis (6379) for local development. |

---

## 5. Module, Service, and Controller (with Import / Export)

This section explains the three building blocks of a NestJS feature and when to **import** vs **export**, using the **Todo sample** as the reference. Code references point to files in `back-end/src/`.

### 5.1 Module

A **module** groups related code (controllers, services, schemas) and declares what it **imports** (dependencies from other modules) and what it **exports** (what other modules can use).

| Concept | Meaning |
|--------|--------|
| **imports** | Other modules this module depends on (e.g. `MongooseModule.forFeature([...])` to use a schema, or `SomeModule` if this module’s service needs `SomeService`). |
| **exports** | Providers (usually services) that other modules can inject if they **import** this module. Without exporting, the provider is only available inside this module. |
| **controllers** | HTTP entry points (routes) of this module. |
| **providers** | Services and other injectables (e.g. guards) used inside this module. |

**Example – Todo module** ([`todos/todos.module.ts`](../back-end/src/todos/todos.module.ts)):

- **Imports:** `MongooseModule.forFeature([Todo])` and **`AuthModule`** (so `JwtAuthGuard` can use `JwtStrategy`; without it, Bearer returns 401).
- **Exports:** `TodosService` so another module (e.g. a future “Reports” module) could inject `TodosService` to list todos in a report.
- **Controllers / providers:** `TodosController`, `TodosService`.

If no other module ever needs `TodosService`, you can omit `exports: [TodosService]`; the API still works because the controller lives in the same module as the service.

**Read more:** [NestJS – Modules](https://docs.nestjs.com/modules), [Feature modules](https://docs.nestjs.com/modules#feature-modules), [Global modules](https://docs.nestjs.com/modules#global-modules).

---

### 5.2 Service

A **service** holds business logic and data access. It is **injectable**: the NestJS DI container creates one instance (per module scope) and injects it into controllers or other services that depend on it.

- Controllers should stay thin: parse request, call service, return response.
- Services contain validation rules, DB calls, calls to external APIs, etc.

**Example – Todo service** ([`todos/todos.service.ts`](../back-end/src/todos/todos.service.ts)):

- Injects the Mongoose model: `@InjectModel(Todo.name) private todoModel: Model<TodoDocument>`.
- Exposes `create`, `findAll`, `findOne`, `update`, `remove`. Each method uses `this.todoModel` (create, find, findByIdAndUpdate, findByIdAndDelete).
- Throws `NotFoundException` when a todo by id is missing, so the controller can return 404.

**When to export a service:** Export from the module when **another module** needs to call this service (e.g. `BacktestModule` imports `TodosModule` and injects `TodosService`). If only this module’s controller uses it, export is optional (but exporting is fine for future reuse).

**Read more:** [NestJS – Providers](https://docs.nestjs.com/providers), [Dependency injection](https://docs.nestjs.com/fundamentals/custom-providers).

---

### 5.3 Controller

A **controller** defines HTTP routes (and Swagger metadata). It receives the request, delegates work to a **service**, and returns the response.

- Use **DTOs** for body/query so `ValidationPipe` can validate (and Swagger can document) the shape.
- Use **guards** (e.g. `JwtAuthGuard`) for protected routes; use `@Public()` to skip auth on specific routes.

**Example – Todo controller** ([`todos/todos.controller.ts`](../back-end/src/todos/todos.controller.ts)):

- `@Controller('todos')` → routes are under `api/v1/todos`.
- `@UseGuards(JwtAuthGuard)` at class level → all routes require a Bearer token by default (token from `POST /auth/login`).
- `@Public()` on `GET /` and `GET /:id` → those two routes are public (no token).
- **`@CurrentUser()`** – parameter decorator to get `request.user` (JwtPayload: `{ sub, email }`) in protected handlers. Example: `create(@Body() dto: CreateTodoDto, @CurrentUser() user: JwtPayload)`. Optional: `@CurrentUser('email')` returns only the email. See [current-user.decorator.ts](back-end/src/common/decorators/current-user.decorator.ts).
- Injects `TodosService`; uses DTOs and Swagger decorators.

**Read more:** [NestJS – Controllers](https://docs.nestjs.com/controllers), [Request handling](https://docs.nestjs.com/controllers#request-object).

---

### 5.4 Import vs Export – When to Use (with Todo example)

| Situation | What to do | Todo example |
|-----------|------------|--------------|
| Your module needs a **Mongoose schema** | **Import** `MongooseModule.forFeature([...])` in your module. | [TodosModule](../back-end/src/todos/todos.module.ts) imports `Todo` schema so `TodosService` can use `@InjectModel(Todo.name)`. |
| Your module needs a **service from another module** | **Import** that module where the service is **exported**. | If `ReportsModule` needed to list todos, it would `imports: [TodosModule]` and inject `TodosService`; that only works because TodosModule **exports** `TodosService`. |
| Another module will use **your service** | **Export** your service from your module. | [TodosModule](../back-end/src/todos/todos.module.ts) has `exports: [TodosService]` so any module that imports `TodosModule` can inject `TodosService`. |
| Your module only uses its own controller + service | You can omit **exports**; no other module needs your providers. | You could remove `exports: [TodosService]` from TodosModule and the Todo API would still work; export is for reuse. |
| Root app needs to expose your routes | **Import** your feature module in **AppModule**. | [AppModule](../back-end/src/app.module.ts) has `imports: [..., TodosModule]` so `/api/v1/todos` is registered. |

**Summary:** **Import** = “I need something from another module.” **Export** = “Other modules can use this provider from me.” The Todo sample shows both: it **imports** the Todo schema and **exports** `TodosService` for potential reuse.

**Reference links (NestJS docs):**

- [Modules](https://docs.nestjs.com/modules)
- [Feature modules](https://docs.nestjs.com/modules#feature-modules)
- [Global modules](https://docs.nestjs.com/modules#global-modules)
- [Providers / DI](https://docs.nestjs.com/providers)
- [Custom providers](https://docs.nestjs.com/fundamentals/custom-providers)
- [Controllers](https://docs.nestjs.com/controllers)
- [Request object](https://docs.nestjs.com/controllers#request-object)

---

## 6. How to Create a New Module

Use these steps to add a new feature module (e.g. `backtest`, `ai`) or to add controllers/services to existing stubs (`auth`, `users`).

### Step 1: Generate or create the module folder

Using Nest CLI (from `back-end/`):

```bash
npx nest g module backtest
npx nest g controller backtest --no-spec
npx nest g service backtest --no-spec
```

Or create by hand:

```
src/backtest/
├── backtest.module.ts
├── backtest.controller.ts
├── backtest.service.ts
└── dto/                    # Optional: DTOs for request validation
    └── run-backtest.dto.ts
```

### Step 2: Implement the module

- **Module** (`backtest.module.ts`): Declare `controllers` and `providers`; import `MongooseModule.forFeature([...])` if you need a schema.
- **Controller**: Use `@Controller('backtest')` so routes are `api/v1/backtest/...`. Use `@ApiTags('backtest')` and `@ApiBearerAuth()` for Swagger. Use DTOs with `class-validator` for body validation.
- **Service**: Put business logic here; inject `ConfigService`, MongoDB models, or `CACHE_MANAGER` as needed.

### Step 3: Register in `app.module.ts`

```ts
import { BacktestModule } from './backtest/backtest.module';

@Module({
  imports: [
    // ... existing
    BacktestModule,
  ],
})
export class AppModule {}
```

### Step 4: Document in Swagger

- Add `@ApiTags('...')` on controllers.
- Use `@ApiBody({ type: RunBacktestDto })` and `@ApiResponse()` where useful.
- For protected routes, use `@ApiBearerAuth()` so Swagger can send the JWT.

### Step 5: (Optional) Use MongoDB

- Create a schema under `src/backtest/schemas/` (e.g. `strategy.schema.ts`) with `@Schema()` and `@Prop()`.
- In `backtest.module.ts`: `MongooseModule.forFeature([{ name: Strategy.name, schema: StrategySchema }])`.
- Inject the model in the service with `@InjectModel(Strategy.name) private strategyModel: Model<Strategy>`.

### Step 6: (Optional) Use Redis cache

- Inject `@Inject(CACHE_MANAGER) private cache: Cache` in the service.
- Use `this.cache.get(key)`, `this.cache.set(key, value, ttlMs)` for caching (e.g. price data).

---

## 7. Where to Implement What (by level)

| Level | Module(s) | Tasks (see developer-tasks.md) |
|-------|------------|--------------------------------|
| 0 – Auth | `auth/`, `users/` | L0-BE-1..7, L0-FE-* (backend: auth + users) |
| 1 – DCA MVP | `backtest/` (new) | L1-BE-1..4, L1-FE-* |
| 2 – Portfolio | `backtest/` (extend) | L2-BE-1..3, L2-FE-* |
| 3 – Triggers | `backtest/` (extend) | L3-BE-1..4, L3-FE-* |
| 4 – AI | `ai/` (new) | L4-BE-1..4, L4-FE-* |

---

## 8. Running the Back-end

```bash
cd back-end
# If first time: cp .env.example .env  and set MONGODB_URI (MongoDB required). Redis optional (REDIS_ENABLED=true + docker compose up -d).
npm install
npm run start:dev
```

- API: `http://localhost:8000/api/v1`
- Swagger: `http://localhost:8000/api/docs`

---

## 9. Testing protected routes in Swagger

To call protected endpoints (e.g. **GET /todos/:id**, POST /todos, PATCH /todos/:id, DELETE /todos/:id) in Swagger with auth:

1. **Get a token**  
   - Call **POST /api/v1/auth/register** or **POST /api/v1/auth/login** in Swagger.  
   - Use a body like `{ "email": "you@example.com", "password": "Password123" }` (register also needs `firstName`, `lastName`).  
   - From the response, copy the **`accessToken`** value (the long string only, without the word "Bearer ").

2. **Authorize in Swagger**  
   - Click the **Authorize** button (lock icon or button at the top right of the Swagger UI).  
   - In the **Value** field, paste your `accessToken`.  
   - Click **Authorize**, then **Close**.

3. **Call the protected endpoint**  
   - Open **GET /todos/{id}** (or any endpoint that shows a lock icon).  
   - Enter a valid todo id (e.g. from a previous GET /todos list response).  
   - Click **Execute**. The request will send `Authorization: Bearer <your token>`.

If you get **401 Unauthorized**, the token may be missing, wrong, or expired. Run login again and repeat from step 2.
