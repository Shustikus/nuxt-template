# nuxt-template

Стартовый репозиторий на **Nuxt 4** с TypeScript, ESLint/Prettier, Vitest, Storybook, MSW и CI.

**Только инфраструктура и архитектурные паттерны** — без UI kit, дизайн-системы и бизнес-фич. Разверните проект и
нарастите `app/features/`, `app/components/` под задачу.

## Ветки

| Ветка    | Содержимое                                                                                                                   |
| -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **main** | Полный набор: TS, managed routing, HTTP-слой, unit/server/e2e/storybook-тесты, Storybook, Docker, CI через GitHub Actions.   |
| другие   | Планируются облегчённые варианты (без Storybook и/или без тестов и т.д.) — см. README соответствующей ветки после появления. |

Текущий документ описывает только **main**. Когда появятся облегчённые ветки, для каждой обновят README под свой набор
инструментов.

## Требования

- **Node.js** `^22.12` или `^24.11` (в CI и Docker — Node 24)
- **npm**

## Что внутри

| Область         | Содержимое                                                                     |
| --------------- | ------------------------------------------------------------------------------ |
| **Nuxt**        | SSR, `@nuxtjs/seo`, `@nuxt/icon`, `@pinia/nuxt`, managed routing, `routeRules` |
| **Архитектура** | Managed routing, HTTP-клиент, Nitro-прокси, структура под FSD-фичи             |
| **Сборка**      | Единый CSS-бандл (`cssCodeSplit: false`), bundle analyzer (`npm run analyze`)  |
| **Качество**    | ESLint (Vue + TS), Prettier, Husky + lint-staged                               |
| **Тесты**       | Vitest: unit (jsdom + MSW), server, e2e, nuxt, storybook                       |
| **Storybook**   | Минимальный каркас для документации (`app/docs/`)                              |
| **Моки API**    | MSW в dev и unit-тестах                                                        |

## Быстрый старт

```bash
npm install
cp .env.example .env   # при необходимости
npm run dev
```

Приложение: [http://localhost:3000](http://localhost:3000)  
Storybook: `npm run storybook` → [http://localhost:6006](http://localhost:6006)

## Архитектурные паттерны

### Managed routing

Маркетинг задаёт URL в [`app/config/routes.ts`](./app/config/routes.ts), компоненты остаются в `app/pages/`.
[`app/router.options.ts`](./app/router.options.ts) подставляет `path` из конфига к file-based маршрутам Nuxt.

### HTTP и прокси

- Клиент: [`app/utils/apiFetch.ts`](./app/utils/apiFetch.ts) — запросы к Nitro `/api/*`
- Конфиг: [`app/config/api.ts`](./app/config/api.ts) — `buildApiUrl`, `resolveBackendOrigin`
- Сервер: [`server/utils/proxyBackendGet.ts`](./server/utils/proxyBackendGet.ts),
  [`server/utils/proxyBackendPost.ts`](./server/utils/proxyBackendPost.ts) — прокси на бэкенд с fallback в Vitest

### Глобальные ошибки

[`app/error.vue`](./app/error.vue) — единая страница для `createError` / `showError`: тексты по HTTP-коду, `useSeoMeta`
с `noindex`, кнопки «На главную» и «Назад» через `clearError`.

### Фичи (добавляйте сами)

```
app/features/<feature>/
  components/
  composables/
  services/
  dto/
  mappers/
  types/
  index.ts          # публичный API фичи
```

## Скрипты

### Разработка и сборка

| Команда                   | Назначение                                                     |
| ------------------------- | -------------------------------------------------------------- |
| `npm run dev`             | Dev-сервер Nuxt ([localhost:3000](http://localhost:3000))      |
| `npm run build`           | Production-сборка (`.output/`)                                 |
| `npm run analyze`         | Сборка + отчёт размера бандла (`.output/bundle-stats.html`)    |
| `npm run generate`        | Статическая генерация (SSG)                                    |
| `npm run preview`         | Preview собранного приложения через `nuxt preview`             |
| `npm run preview:node`    | Запуск `.output/server/index.mjs` с `.env` (как в Docker/prod) |
| `npm run start`           | `nuxt start` — production-сервер после `build`                 |
| `npm run storybook`       | Storybook dev ([localhost:6006](http://localhost:6006))        |
| `npm run build-storybook` | Статическая сборка Storybook (`storybook-static/`)             |

### Качество кода

| Команда                | Назначение                            |
| ---------------------- | ------------------------------------- |
| `npm run lint`         | ESLint по всему проекту               |
| `npm run lint:fix`     | ESLint с автоисправлением             |
| `npm run format`       | Prettier — перезапись файлов          |
| `npm run format:check` | Prettier — только проверка            |
| `npm run typecheck`    | `nuxt prepare` + `vue-tsc` (без emit) |

### Тесты

| Команда                    | Назначение                                                         |
| -------------------------- | ------------------------------------------------------------------ |
| `npm test`                 | Алиас на `test:unit`                                               |
| `npm run test:unit`        | Unit-тесты в watch-режиме (jsdom + MSW)                            |
| `npm run test:unit:run`    | Unit-тесты один раз                                                |
| `npm run test:nuxt`        | Тесты в Nuxt runtime (`tests/nuxt/`)                               |
| `npm run test:e2e`         | E2E smoke через Playwright + `@nuxt/test-utils`                    |
| `npm run test:e2e:install` | Установить Chromium для Playwright (локально)                      |
| `npm run test:ci:install`  | Chromium + системные deps (для CI/Linux)                           |
| `npm run test:storybook`   | Storybook-тесты в headless Chromium                                |
| `npm run test:coverage`    | Unit + server с отчётом coverage                                   |
| `npm run test:ci`          | Unit + server, MSW strict (`VITEST_MSW_UNHANDLED=error`), coverage |

Проекты Vitest: `unit`, `server`, `e2e`, `nuxt`, `storybook` — см. [`vitest.config.ts`](./vitest.config.ts).

### CI-агрегаты

| Команда          | Назначение                                                      |
| ---------------- | --------------------------------------------------------------- |
| `npm run ci`     | `lint` → `typecheck` → `test:ci` (основной локальный/CI прогон) |
| `npm run ci:e2e` | Установка Playwright + e2e с `NUXT_E2E_HOST`                    |
| `npm run check`  | `lint` → `typecheck` → `test:coverage`                          |

### Служебные (lifecycle)

| Команда       | Когда                                                 |
| ------------- | ----------------------------------------------------- |
| `postinstall` | После `npm install` — `nuxt prepare` (типы, `.nuxt/`) |
| `prepare`     | После install — установка Husky (pre-commit hooks)    |

### Docker Compose

Скриптов в `package.json` нет — используйте compose напрямую:

```bash
docker compose up web              # production-образ
docker compose --profile dev up dev
docker compose --profile storybook up storybook
docker compose --profile storybook-dev up storybook-dev
```

## Переменные окружения

Шаблон ключей — [`.env.example`](./.env.example).

| Переменная             | `runtimeConfig`  | Где доступна    |
| ---------------------- | ---------------- | --------------- |
| `NUXT_PUBLIC_SITE_URL` | `public.siteUrl` | клиент и сервер |
| `NUXT_API_BASE_URL`    | `apiBaseUrl`     | только сервер   |

## Структура

```
app/
  error.vue             # глобальная страница ошибок
  router.options.ts     # managed routing
  config/routes.ts      # URL, meta, renderMode → routeRules
  config/api.ts         # HTTP/proxy conventions
  utils/apiFetch.ts     # HTTP-клиент
  shared/               # cross-cutting utils, composables
  pages/                # file-based route names
  composables/          # shared composables
  middleware/           # route middleware
  components/           # ui/, layout/ по мере роста
  features/             # .gitkeep — бизнес-модули
  stores/               # .gitkeep — Pinia
  docs/                 # Storybook
server/
  api/                  # Nitro handlers
  middleware/           # Nitro middleware
  utils/                # proxyBackendGet, proxyBackendPost, resolveRuntimeConfigString
mocks/                  # MSW (dev + Vitest)
tests/                  # unit, server, e2e, nuxt
```

## MSW

- **Dev:** [`app/plugins/msw.client.ts`](./app/plugins/msw.client.ts) + [`mocks/handlers.ts`](./mocks/handlers.ts) —
  моки API, пока нет бэкенда
- **Production:** реальные запросы к Nitro или бэкенду (MSW не подключается)
- **Unit-тесты:** [`tests/setup.ts`](./tests/setup.ts) + те же handlers через `mocks/server.ts`
- **CI:** `VITEST_MSW_UNHANDLED=error`

## Docker и CI

Multi-stage [`Dockerfile`](./Dockerfile), [`docker-compose.yaml`](./docker-compose.yaml).  
CI: [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) — lint, typecheck, `npm audit`, coverage, gitleaks,
storybook, e2e.

Локально: `npm run ci`.

## Ссылки

- [Nuxt](https://nuxt.com/docs) · [Vue](https://vuejs.org/guide/introduction.html) · [Vitest](https://vitest.dev/guide/)
- [Storybook Vue 3 + Vite](https://storybook.js.org/docs/get-started/frameworks/vue3-vite)
- [MSW](https://mswjs.io/)
- [Icônes](https://icones.js.org/)
- [google-webfonts-helper](https://gwfh.mranftl.com/fonts)
