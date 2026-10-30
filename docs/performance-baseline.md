# Performance baseline

Дата замера: 2026-07-21.

## Production build

Команда: `npm run analyze`.

- Преобразовано клиентских модулей: 2444.
- Общий CSS: 467.08 kB, gzip 69.22 kB.
- Два крупнейших клиентских JS-чанка: 261.88 kB (gzip 64.92 kB) и 264.24 kB (gzip 60.01 kB).
- Крупнейшие серверные feature-чанки: catalog 448.16 kB, engineering-calculators 227.68 kB, cart 226.80 kB.
- Client build: 8.99 s.
- Server build: 7.49 s.

Сборка дошла до prerender 43 маршрутов, но не завершилась без доступного backend. Поэтому `bundle-stats.html`, runtime
TTFB и Web Vitals в этом окружении изначально не зафиксированы.

## Обязательные runtime-замеры

На окружении с доступным backend измерять `/`, `/catalog`, типичный listing и PDP:

- TTFB, LCP, CLS, INP;
- размер document и Nuxt payload;
- число backend-запросов до готовности SSR HTML;
- hydration duration и long tasks;
- initial и route JS/CSS.

Для сравнения изменений использовать одинаковые URL, viewport, throttling и очищенный cache. Бюджеты сборки проверяет
`npm run check:performance`.

## Runtime Web Vitals (пример замера)

Production build (`cssCodeSplit: false`), сервер `http://127.0.0.1:3010`, backend `http://backend.local`.

Методика: `PERF_RUNS=3 node scripts/measure-web-vitals.mjs http://127.0.0.1:3010`. Cold context Playwright Chromium,
viewport 1366×768, без CPU/network throttling. Медиана по 3 прогонам. Сырые данные: `docs/performance-runtime.json`,
сводка: `docs/performance-runtime-summary.json`.

| Route                 |   TTFB |    FCP |    LCP |   CLS |    INP | Document |     JS* |   CSS* | Long tasks |
| --------------------- | -----: | -----: | -----: | ----: | -----: | -------: | ------: | -----: | ---------: |
| `/`                   |  20 ms | 128 ms | 128 ms | 0.003 | ~16 ms |  115 KiB | 353 KiB | 53 KiB |      79 ms |
| `/catalog`            | 105 ms | 220 ms | 220 ms | 0.003 | ~16 ms |  251 KiB | 360 KiB | 53 KiB |      65 ms |
| listing дымовых газов | 201 ms | 300 ms | 536 ms | 0.055 | ~16 ms |  322 KiB | 334 KiB | 53 KiB |     152 ms |
| PDP demo-multimeter   | 219 ms | 380 ms | 380 ms | 0.006 | ~16 ms |  583 KiB | 336 KiB | 53 KiB |     251 ms |

\*JS/CSS — сумма `Content-Length` на cold document load (не Performance decoded size).

Дополнительно:

- Curl SSR TTFB (медиана): `/` 13 ms, `/catalog` 124 ms, listing 183 ms, PDP 195 ms.
- Client `/api` после HTML: 2–3 запроса.
- SSR backend waterfall в браузере не виден; hydration marks Nuxt не экспонируются.
- PDP измерен на mock-handler: реальный PDP через Nuxt API не проксируется.
- Bundle budget после замера: JS 2988 KiB / 3584, CSS 456 KiB / 600 (1 файл).
- INP синтетический (лёгкий hover/click); для реального INP нужен полевой RUM.

## CSS splitting experiment

Production по умолчанию сохраняет единый CSS-бандл, поскольку route-level splitting ранее вызывал FOUC. Для повторяемого
сравнения доступна команда `npm run build:css-split`. Экспериментальная сборка создала 59 CSS-чанков общим размером
456.4 KiB; крупнейший чанк — около 57 KiB, а production build и bundle budget прошли. Включать splitting по умолчанию
можно только после визуальной проверки прямой загрузки и client navigation всех основных маршрутов и подтверждённого
улучшения FCP/LCP.
