# nuxt-template

Минимальный стартовый репозиторий на **Nuxt 4** с TypeScript, ESLint/Prettier, Vitest, Storybook, MSW и CI.

Не содержит дизайн-систему и бизнес-фичи — только инфраструктура, чтобы развернуть новый проект и нарастить код под
задачу.

## Ветки

| Ветка    | Содержимое                                                                                                                             |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **main** | Полный набор: TS, unit-тесты, Storybook (+ браузерные тесты сторис через Vitest), переменные окружения через `runtimeConfig` и `.env`. |
| другие   | Планируются облегчённые варианты (без Storybook и/или без тестов и т.д.) — см. README соответствующей ветки после появления.           |

Текущий документ описывает только **main**. Когда появятся облегчённые ветки, для каждой обновят README под свой набор
инструментов.

## Что внутри

| Область       | Содержимое                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------ |
| **Nuxt**      | SSR, `@nuxtjs/seo`, `@nuxt/icon`, `@pinia/nuxt`, `routeRules` из `app/config/routes.ts`    |
| **Сборка**    | Единый CSS-бандл (`cssCodeSplit: false`), опциональный bundle analyzer (`npm run analyze`) |
| **Качество**  | ESLint (Vue + TS), Prettier, Husky + lint-staged                                           |
| **Тесты**     | Vitest: unit (jsdom + MSW), server, e2e, nuxt, storybook (Chromium)                        |
| **Storybook** | Vue 3 + Vite, алиасы `~/` / `@`, shims для `NuxtLink` и `Icon`                             |
| **Моки API**  | MSW в dev и в unit-тестах                                                                  |

## Требования

- **Node.js** `^22.12` или `^24.11` (как у Nuxt 4.4 в `package.json`; в CI — Node 24)
- **npm**

## Быстрый старт

```bash
npm install
cp .env.example .env   # при необходимости
npm run dev
```

Приложение: [http://localhost:3000](http://localhost:3000)  
Storybook: `npm run storybook` → [http://localhost:6006](http://localhost:6006)

## Скрипты

| Команда                                   | Назначение                                           |
| ----------------------------------------- | ---------------------------------------------------- |
| `npm run dev`                             | Режим разработки                                     |
| `npm run build`                           | Production-сборка                                    |
| `npm run preview`                         | Превью собранного приложения                         |
| `npm start`                               | `nuxt start` (после `build`)                         |
| `npm run generate`                        | Статическая генерация                                |
| `npm run analyze`                         | Сборка с отчётом размера бандла                      |
| `npm run lint` / `npm run lint:fix`       | ESLint                                               |
| `npm run format` / `npm run format:check` | Prettier                                             |
| `npm run typecheck`                       | `vue-tsc` (см. `tsconfig.json`)                      |
| `npm run test`                            | Vitest, проект **unit** (watch)                      |
| `npm run test:unit:run`                   | Unit-тесты один прогон                               |
| `npm run test:coverage`                   | Unit + server с coverage                             |
| `npm run test:ci`                         | Как в CI: unit + server, MSW strict, coverage        |
| `npm run test:e2e`                        | E2E smoke (нужен запущенный dev или `NUXT_E2E_HOST`) |
| `npm run test:e2e:install`                | Установка Chromium для Playwright                    |
| `npm run test:storybook`                  | Тесты сторис в браузере                              |
| `npm run storybook`                       | Storybook dev                                        |
| `npm run build-storybook`                 | Статика в `storybook-static/`                        |
| `npm run ci`                              | lint + typecheck + test:ci                           |
| `npm run ci:e2e`                          | Playwright + e2e против localhost:3000               |
| `npm run check`                           | lint + typecheck + test:coverage                     |

## Переменные окружения

Шаблон ключей — [`.env.example`](./.env.example). Файл `.env` в git не коммитится.

Nuxt мапит переменные в `runtimeConfig` ([`nuxt.config.ts`](./nuxt.config.ts)):

| Переменная             | `runtimeConfig`  | Где доступна    |
| ---------------------- | ---------------- | --------------- |
| `NUXT_PUBLIC_SITE_URL` | `public.siteUrl` | клиент и сервер |
| `NUXT_PUBLIC_API_BASE` | `public.apiBase` | клиент и сервер |
| `NUXT_API_SECRET`      | `apiSecret`      | только сервер   |

Публичные ключи: префикс `NUXT_PUBLIC_`, в коде — camelCase после префикса.

## Структура

```
app/
  app.vue
  pages/              # file-based routes
  layouts/
  components/         # .gitkeep — добавьте UI по мере роста
  config/routes.ts    # meta.renderMode → routeRules (ssr | ssg | spa)
  assets/styles/      # main.css + базовые CSS-переменные в tokens/
  docs/               # Storybook: MDX, *.stories.ts
  plugins/msw.client.ts
mocks/                # MSW handlers (пример: GET /api/health)
server/               # Nitro: api/, middleware/ (.gitkeep)
.storybook/           # конфиг, preview, shims
tests/                # unit, e2e, setup MSW
.github/workflows/    # CI, publish (Docker → GHCR)
Dockerfile, Dockerfile.storybook, compose.yaml
```

Автоимпорт компонентов: `~/components` без префикса папки ([`nuxt.config.ts`](./nuxt.config.ts)).

**Маршруты:** по умолчанию Nuxt строит их из `app/pages/`. Файл [`app/config/routes.ts`](./app/config/routes.ts) задаёт
только `routeRules` (SSR/SSG/SPA). Управляемый роутинг через `router.options` в шаблон не входит — добавьте сами, если
нужны URL из конфига.

## MSW

- **Dev:** плагин [`app/plugins/msw.client.ts`](./app/plugins/msw.client.ts) поднимает worker; необработанные запросы —
  `bypass`.
- **Unit-тесты:** [`tests/setup.ts`](./tests/setup.ts) + [`mocks/server.ts`](./mocks/server.ts).
- **Обработчики:** [`mocks/handlers.ts`](./mocks/handlers.ts) — сейчас заглушка `GET /api/health`.
- **CI:** `test:ci` выставляет `VITEST_MSW_UNHANDLED=error`.

## Docker

Multi-stage [`Dockerfile`](./Dockerfile): `deps` → `build` → `production` (Nitro из `.output/server/index.mjs`). Для dev
с hot-reload — target `development` и профиль `dev` в [`compose.yaml`](./compose.yaml).

```bash
# Production-образ
docker build -t nuxt-template .
docker run --rm -p 3000:3000 \
  -e NUXT_PUBLIC_SITE_URL=http://localhost:3000 \
  nuxt-template

# Через Compose (сервис web)
docker compose up --build

# Dev в контейнере (volume с исходниками)
docker compose --profile dev up --build dev

# Storybook — отдельный Dockerfile.storybook
docker compose --profile storybook up --build storybook      # статика (nginx), :6006
docker compose --profile storybook-dev up --build storybook-dev  # dev-сервер
```

Публикация **Nuxt**-образа в **GHCR** — [`.github/workflows/publish.yml`](./.github/workflows/publish.yml): после
успешного CI на `main`, по тегам `v*` или вручную (`workflow_dispatch`). Образ: `ghcr.io/<owner>/<repo>:latest`.
Опционально — repository variables `NUXT_PUBLIC_SITE_URL` и `NUXT_PUBLIC_API_BASE` для build-args.

## CI

Workflow [`.github/workflows/ci.yml`](./.github/workflows/ci.yml):

1. lint, typecheck, unit + server (coverage)
2. gitleaks
3. Storybook tests + `build-storybook`
4. e2e smoke (dev-сервер на порту 3000)

Workflow [`.github/workflows/publish.yml`](./.github/workflows/publish.yml): сборка production-образа и push в GitHub
Container Registry.

Локально перед push: `npm run ci`. E2E отдельно: поднять `npm run dev`, затем `npm run ci:e2e`.

## Vitest: проекты

| Проект      | Каталог                              | Назначение                      |
| ----------- | ------------------------------------ | ------------------------------- |
| `unit`      | `tests/**` (кроме server, e2e, nuxt) | jsdom, MSW setup                |
| `server`    | `tests/server/**`                    | Nitro handlers (пока пусто)     |
| `e2e`       | `tests/e2e/**`                       | Playwright + `@nuxt/test-utils` |
| `nuxt`      | `tests/nuxt/**`                      | Nuxt environment (пока пусто)   |
| `storybook` | сторис из `app/`                     | браузер Chromium                |

Coverage в `vitest.config.ts` нацелен на `app/features/**` и `server/api/**` — пороги сработают, когда появится доменный
код.

## Обновление зависимостей

**Массово** (может поднять major-версии в `package.json`):
[npm-check-updates](https://github.com/raineorshine/npm-check-updates):

```bash
npx npm-check-updates -u
npm install
npm run ci
```

**В рамках semver** — встроенный [`npm outdated`](https://docs.npmjs.com/cli/v11/commands/npm-outdated):

```bash
npm outdated
npm update
npm run ci
```

`npm update` подтягивает версии в пределах диапазонов из `package.json` (`^`, `~`). Для major или точной версии —
вручную: `npm install <пакет>@latest`, затем снова `npm run ci`.

## Замечания

- Для typecheck используйте **`npm run typecheck`**, не `nuxt typecheck` (в части окружений падает с
  `spawn npx ENOENT`).
- При **`build-storybook`** возможно предупреждение `unable to find package.json for @nuxt/icon` — на артефакт обычно не
  влияет; в [`.storybook/main.ts`](./.storybook/main.ts) модуль в `optimizeDeps.include`.
- Prettier: [`.prettierrc.json`](./.prettierrc.json).

## Ссылки

- [Nuxt](https://nuxt.com/docs) · [Vue](https://vuejs.org/guide/introduction.html) · [Vitest](https://vitest.dev/guide/)
- [Storybook Vue 3 + Vite](https://storybook.js.org/docs/get-started/frameworks/vue3-vite)
- [MSW](https://mswjs.io/) · [Icônes](https://icones.js.org/)
- [google-webfonts-helper](https://gwfh.mranftl.com/fonts)
