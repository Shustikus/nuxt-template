# nuxt-template

Стартовый репозиторий на **Nuxt 4** с TypeScript, Vitest, Storybook и ESLint/Prettier: единый CSS-бандл в Vite,
`routeRules` из `app/config/routes.ts`, Storybook с алиасами `~/` и shim для `NuxtLink`.

## Ветки

| Ветка    | Содержимое                                                                                                                             |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **main** | Полный набор: TS, unit-тесты, Storybook (+ браузерные тесты сторис через Vitest), переменные окружения через `runtimeConfig` и `.env`. |
| другие   | Планируются облегчённые варианты (без Storybook и/или без тестов и т.д.) — см. README соответствующей ветки после появления.           |

Текущий документ описывает только **main**. Когда появятся облегчённые ветки, для каждой обновят README под свой набор
инструментов.

## Требования

- Node.js **20+** (рекомендуется LTS)
- npm

## Обновление версий в `package.json`

Чтобы **переписать версии в самом `package.json`** по данным npm (массово), удобно
**[npm-check-updates](https://github.com/raineorshine/npm-check-updates)** (`ncu`).

1. **Установите утилиту глобально** (один раз на машину):

   ```bash
   npm install -g npm-check-updates
   ```

2. **В корне репозитория** обновите записи в `package.json` до актуальных версий из реестра:

   ```bash
   ncu -u
   ```

3. **Пересоберите lock и `node_modules`:**

   ```bash
   npm install
   ```

Без глобальной установки то же самое: `npx npm-check-updates -u`, затем `npm install`.

**Точечно без `ncu`:** `npm outdated` — что отстаёт; `npm install имя@latest` или `npm install -D имя@версия` — npm сам
меняет строку в `package.json` и lock для выбранных пакетов. Вручную отредактировать `package.json` и выполнить
`npm install` тоже можно.

**Про `npm update`:** обычно подтягивает установки в рамках уже указанных в манифесте диапазонов (`^` / `~`) и **не
обязана** менять сами поля версий в `package.json`. Для массового поднятия записей в манифесте используйте **`ncu -u`**
или **`npm install …@версия`**.

После обновления зависимостей проверьте проект: `npm run typecheck`, `npm run test:run`, `npm run build`, при
необходимости `npm run build-storybook`.

## Установка и скрипты

```bash
npm install
cp .env.example .env   # при необходимости поправьте значения
npm run dev
```

| Команда                                   | Назначение                                                 |
| ----------------------------------------- | ---------------------------------------------------------- |
| `npm run dev`                             | Режим разработки                                           |
| `npm run build` / `npm run preview`       | Сборка и превью production                                 |
| `npm start`                               | Запуск собранного приложения (`nuxt start`, после `build`) |
| `npm run generate`                        | Статическая генерация (`nuxt generate`)                    |
| `npm run test` / `npm run test:run`       | Vitest, проект **unit** (jsdom)                            |
| `npm run test:coverage`                   | Unit-тесты с отчётом **@vitest/coverage-v8** в `coverage/` |
| `npm run test:storybook`                  | Vitest, проект **storybook** (Chromium через Playwright)   |
| `npm run storybook`                       | Storybook на порту 6006                                    |
| `npm run build-storybook`                 | Статическая сборка Storybook в `storybook-static/`         |
| `npm run lint` / `npm run lint:fix`       | ESLint                                                     |
| `npm run typecheck`                       | Проверка типов (`vue-tsc`, см. `tsconfig.json`)            |
| `npm run format` / `npm run format:check` | Prettier                                                   |

## Переменные окружения

Nuxt подставляет значения из `.env` в `runtimeConfig` (см. `nuxt.config.ts`).

- **Публичные** (видны на клиенте): префикс `NUXT_PUBLIC_`, ключи в `camelCase` после префикса.  
  Пример: `NUXT_PUBLIC_SITE_URL` → `useRuntimeConfig().public.siteUrl`.
- **Серверные только**: префикс `NUXT_` без `PUBLIC_`.  
  Пример: `NUXT_API_SECRET` → `useRuntimeConfig().apiSecret` (только на сервере).

Шаблон ключей лежит в [`.env.example`](./.env.example). Файл `.env` в git не коммитится (см. `.gitignore`).

## Структура репозитория

Сейчас в дереве:

- `app/` — корневое приложение: [`app.vue`](./app/app.vue), [`pages/`](./app/pages/), [`layouts/`](./app/layouts/),
  [`config/routes.ts`](./app/config/routes.ts) (источник для `routeRules`: `meta.renderMode` — `ssr` | `ssg` | `spa`),
  [`assets/styles/`](./app/assets/styles/) (`main.css`, токены в `styles/tokens/`), [`docs/`](./app/docs/) (MDX intro,
  `*.stories.ts` для Storybook).
- [`.storybook/`](./.storybook/) — конфиг Storybook, preview, shims (в т.ч. `NuxtLink`).
- [`tests/`](./tests/) — unit-тесты Vitest (проект **unit**).

Автоимпорт компонентов настроен на `~/components` в [`nuxt.config.ts`](./nuxt.config.ts); каталога `app/components/`
пока нет — создайте его при появлении общих Vue-компонентов (сторис удобно класть рядом с компонентом или в
`app/docs/`).

Опционально под ваш проект: Nitro [`server/api`](https://nuxt.com/docs/guide/directory-structure/server), корневой
`mocks/` под MSW (сгенерированный `public/mockServiceWorker.js` в [`.gitignore`](./.gitignore) не коммитить).

Конфиг Prettier: [`.prettierrc`](./.prettierrc).

## Замечания по сборке

- **`nuxt typecheck`** иногда падает с `spawn npx ENOENT`, если у дочернего процесса нет `npx` в `PATH`. Для CI и
  локальной проверки используйте **`npm run typecheck`** (`vue-tsc --noEmit`, см. `tsconfig.json`).
- У **`build-storybook`** на этапе manager Vite может вывести предупреждение
  **`unable to find package.json for @nuxt/icon`**. Это связано с тем, как бандлер обходит Nuxt-модуль вне полного
  Nuxt-контекста; на результат сборки обычно не влияет. В preview `@nuxt/icon` добавлен в `optimizeDeps.include`.
