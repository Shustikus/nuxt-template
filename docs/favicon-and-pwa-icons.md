# Комплект фавиконок сайта и PWA-иконок (`public/favicon/`)

Все файлы фавиконок и иконок PWA объединены в папку [`public/favicon/`](../public/favicon/). Все иконки выполнены с
прозрачным фоном.

## Файлы в папке:

- `favicon.ico` — классический мультиразмерный .ico (фреймы 16x16, 32x32, 48x48) с прозрачным фоном. Дублируется в корне
  как [`public/favicon.ico`](../public/favicon.ico) для старых краулеров.
- `favicon.svg` — векторный фавикон для современных браузеров (Chrome, Firefox, Safari).
- `icon-16x16.png`, `icon-32x32.png`, `icon-48x48.png`, `icon-72x72.png`, `icon-96x96.png`, `icon-128x128.png`,
  `icon-144x144.png`, `icon-152x152.png`, `icon-192x192.png`, `icon-256x256.png`, `icon-384x384.png`, `icon-512x512.png`
  — единый ряд растровых иконок высокого разрешения с прозрачным фоном (`purpose: any`).
- `icon-maskable-192x192.png` и `icon-maskable-512x512.png` — адаптивные maskable иконки с безопасными полями 10% (safe
  area 80%) для Android (`purpose: maskable`).
- `apple-touch-icon.png` — иконка 180x180 для устройств Apple iOS (iPhone, iPad).
- `site.webmanifest` и `manifest.json` — веб-манифесты со ссылками на `/favicon/...`, параметром
  `"background_color": "transparent"`, идентификатором `"id": "/"` и скриншотами интерфейса для Richer PWA Install UI.
- `screenshot-wide.png` (1280x720, `form_factor: wide`) и `screenshot-narrow.png` (750x1334, `form_factor: narrow`) —
  скриншоты для десктопного и мобильного диалога установки PWA.

> [!NOTE] **Важно**: Скриншоты `screenshot-wide.png` и `screenshot-narrow.png` сейчас сформированы для удовлетворения
> требований Chrome Richer PWA Install UI. Их **нужно будет переделать и обновить**, когда будет полностью готов
> финальный дизайн главной страницы сайта.

## Подключение в HTML `<head>`:

```html
<link
	rel="icon"
	type="image/x-icon"
	href="/favicon/favicon.ico?v=2"
/>
<link
	rel="icon"
	type="image/svg+xml"
	href="/favicon/favicon.svg?v=2"
/>
<link
	rel="icon"
	type="image/png"
	sizes="96x96"
	href="/favicon/icon-96x96.png?v=2"
/>
<link
	rel="icon"
	type="image/png"
	sizes="32x32"
	href="/favicon/icon-32x32.png?v=2"
/>
<link
	rel="icon"
	type="image/png"
	sizes="16x16"
	href="/favicon/icon-16x16.png?v=2"
/>
<link
	rel="apple-touch-icon"
	sizes="180x180"
	href="/favicon/apple-touch-icon.png?v=2"
/>
<link
	rel="manifest"
	href="/favicon/site.webmanifest"
/>
<meta
	name="apple-mobile-web-app-title"
	content="Nuxt Template"
/>
<meta
	name="theme-color"
	content="#020420"
/>
```

_(Примечание: для максимальной совместимости со старыми ботами и браузерами копия `favicon.ico` также может лежать в
корне `/favicon.ico`)_.
