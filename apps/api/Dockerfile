FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm dlx turbo prune --scope=api --docker

FROM base AS installer
WORKDIR /app

COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

RUN pnpm rebuild bcrypt sharp

COPY --from=builder /app/out/full/ .
RUN pnpm turbo run build --filter=api

RUN pnpm prune --prod --no-optional

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

COPY --from=installer --chown=nestjs:nodejs --chmod=555 /app/node_modules ./node_modules

COPY --from=installer --chown=nestjs:nodejs --chmod=555 /app/apps/api/dist ./apps/api/dist

COPY --from=installer --chown=nestjs:nodejs --chmod=555 /app/apps/api/package.json ./apps/api/package.json

COPY --from=installer --chown=nestjs:nodejs --chmod=555 /app/apps/api/src/providers/database/seed/images ./apps/api/src/providers/database/seed/images

CMD ["node", "apps/api/dist/src/main"]