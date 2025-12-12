FROM node:18-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm dlx turbo prune --scope=web --docker

FROM base AS installer
WORKDIR /app

COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --ignore-scripts

RUN pnpm rebuild esbuild

COPY --from=builder /app/out/full/ .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm turbo run build --filter=web

FROM nginx:alpine AS runner
RUN rm -rf /etc/nginx/conf.d/*
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=installer /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]