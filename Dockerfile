# syntax=docker/dockerfile:1

# Зависимости (кэшируется отдельно от исходников)
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm config set fetch-retries 5 \
	&& npm config set fetch-retry-mintimeout 20000 \
	&& npm ci --ignore-scripts

# Production-сборка Nuxt → .output/
# Build-args и runtime env — в docker-compose.yaml и .env
FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NUXT_PUBLIC_SITE_URL
ARG NUXT_PUBLIC_API_BASE
ENV NUXT_PUBLIC_SITE_URL=$NUXT_PUBLIC_SITE_URL
ENV NUXT_PUBLIC_API_BASE=$NUXT_PUBLIC_API_BASE

RUN NODE_ENV=production npm run build

# Режим разработки (docker compose --profile dev)
FROM node:24-alpine AS development
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm config set fetch-retries 5 \
	&& npm config set fetch-retry-mintimeout 20000 \
	&& npm ci --ignore-scripts
COPY . .
EXPOSE 3000
CMD ["sh", "-c", "exec npm run dev -- --host \"${HOST:-0.0.0.0}\" --port \"${PORT:-3000}\""]

# Минимальный runtime: только собранный Nitro-сервер
FROM node:24-alpine AS production
WORKDIR /app

RUN addgroup -S nodejs && adduser -S nuxt -G nodejs

COPY --from=build --chown=nuxt:nodejs /app/.output ./.output

USER nuxt
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
	CMD wget -qO- http://127.0.0.1:3000/ || exit 1

CMD ["node", ".output/server/index.mjs"]
