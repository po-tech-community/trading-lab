# ── Stage 1: builder ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Build tools needed to compile bcrypt native bindings
RUN apk add --no-cache python3 make g++

COPY package*.json .npmrc ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: runner ───────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Build tools needed to recompile bcrypt native bindings for this Alpine image
RUN apk add --no-cache python3 make g++

COPY package*.json .npmrc ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 8000

CMD ["node", "dist/main.js"]
