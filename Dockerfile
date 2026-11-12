# syntax=docker/dockerfile:1

ARG NODE_VERSION=24-alpine
ARG NGINX_VERSION=1.29-alpine

# ---------------------------------------------------------------------------
# Base: Node + pnpm (version pinned by the "packageManager" field in package.json)
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS base
RUN corepack enable
WORKDIR /app

# ---------------------------------------------------------------------------
# Dependencies: install from the lockfile only, so this layer is cached until it changes
# ---------------------------------------------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# Development: Angular dev server with hot reload. The compose file bind-mounts the sources.
# ---------------------------------------------------------------------------
FROM deps AS dev
COPY . .
EXPOSE 4200
CMD ["pnpm", "exec", "ng", "serve", "--configuration", "development", "--host", "0.0.0.0", "--port", "4200", "--poll", "1000"]

# ---------------------------------------------------------------------------
# Production build. API_ORIGIN is baked into the bundle and is required.
# ---------------------------------------------------------------------------
FROM deps AS build
ARG API_ORIGIN
ENV API_ORIGIN=${API_ORIGIN} \
    ELECTROLINK_REQUIRE_API_ORIGIN=true
COPY . .
RUN pnpm build

# ---------------------------------------------------------------------------
# Runtime: unprivileged nginx serving the static bundle with SPA fallback (non-root, port 8080)
# ---------------------------------------------------------------------------
FROM nginxinc/nginx-unprivileged:${NGINX_VERSION} AS runtime
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/project-frontend-web/browser /usr/share/nginx/html
EXPOSE 8080
