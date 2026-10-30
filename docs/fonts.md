# Руководство по подключению шрифтов

В репозитории используется стратегия self-hosted шрифтов: файлы шрифтов отдаются напрямую вашим сервером без внешних
запросов к сторонним CDN во время рендеринга. Это гарантирует максимальную приватность, стабильность и высокие
показатели Core Web Vitals (отсутствие сторонних DNS-lookup и блокировок соединения).

---

## 1. Где брать шрифты

Для проектов на базе Google Fonts рекомендуется использовать сервис
[google-webfonts-helper](https://gwfh.mranftl.com/fonts):

1. Найдите нужный шрифт (например, **Inter**, **Roboto**, **Manrope**, **Montserrat**).
2. Выберите необходимые наборы символов (charsets): как правило, достаточно **cyrillic** и **latin** (при необходимости
   **latin-ext**).
3. Выберите только используемые начертания (weights): например, `regular (400)`, `medium (500)`, `semi-bold (600)`,
   `bold (700)`. Избегайте скачивания неиспользуемых начертаний для экономии трафика.
4. В блоке **Download** скачайте архив.
5. Для современных браузеров используйте исключительно формат **`.woff2`** (наименьший размер, сжатие Brotli,
   поддерживается всеми браузерами с 2018 года).

---

## 2. Размещение файлов в проекте

Поместите файлы шрифтов в директорию [`public/fonts/`](file:///home/mihail/projects/nuxt-template/public/fonts):

```text
public/fonts/
  ├── inter-v20-cyrillic_latin-regular.woff2
  ├── inter-v20-cyrillic_latin-500.woff2
  ├── inter-v20-cyrillic_latin-600.woff2
  └── inter-v20-cyrillic_latin-700.woff2
```

Файлы из `public/fonts/` доступны в браузере по абсолютным путям `/fonts/<filename>.woff2`.

---

## 3. Описание `@font-face`

Создайте файл стилей шрифтов (например, `app/assets/styles/tokens/fonts.css`) или добавьте правила в
[`app/assets/styles/tokens/typography.css`](file:///home/mihail/projects/nuxt-template/app/assets/styles/tokens/typography.css):

```css
/* regular - 400 */
@font-face {
	font-family: "Inter";
	font-style: normal;
	font-weight: 400;
	font-display: swap;
	src: url("/fonts/inter-v20-cyrillic_latin-regular.woff2") format("woff2");
}

/* medium - 500 */
@font-face {
	font-family: "Inter";
	font-style: normal;
	font-weight: 500;
	font-display: swap;
	src: url("/fonts/inter-v20-cyrillic_latin-500.woff2") format("woff2");
}

/* semibold - 600 */
@font-face {
	font-family: "Inter";
	font-style: normal;
	font-weight: 600;
	font-display: swap;
	src: url("/fonts/inter-v20-cyrillic_latin-600.woff2") format("woff2");
}

/* bold - 700 */
@font-face {
	font-family: "Inter";
	font-style: normal;
	font-weight: 700;
	font-display: swap;
	src: url("/fonts/inter-v20-cyrillic_latin-700.woff2") format("woff2");
}
```

> [!IMPORTANT] Всегда указывайте `font-display: swap;` для предотвращения FOIT (Flash of Invisible Text) и обеспечения
> быстрой отрисовки текста резервным системным шрифтом.

---

## 4. Настройка CSS-переменных (Design Tokens)

В файле
[`app/assets/styles/tokens/typography.css`](file:///home/mihail/projects/nuxt-template/app/assets/styles/tokens/typography.css)
укажите ваш шрифт первым в семействе с системными фолбэками:

```css
:root {
	--font-sans: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
	--font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;
}
```

Если создаётся отдельный файл `app/assets/styles/tokens/fonts.css`, импортируйте его в
[`app/assets/styles/main.css`](file:///home/mihail/projects/nuxt-template/app/assets/styles/main.css):

```css
@import "./tokens/fonts.css";
@import "./tokens/colors.css";
@import "./tokens/typography.css";
...
```

---

## 5. Готовая конфигурация в Nuxt

В шаблоне уже преднастроена вся необходимая инфраструктура для шрифтов:

1. **Кэширование на 1 год (immutable)** в [`nuxt.config.ts`](file:///home/mihail/projects/nuxt-template/nuxt.config.ts):
   ```typescript
   rules["/fonts/**"] = { headers: { "cache-control": "public, max-age=31536000, immutable" } };
   ```
2. **CSP (Content Security Policy)** в [`nuxt.config.ts`](file:///home/mihail/projects/nuxt-template/nuxt.config.ts):
   Директива `font-src 'self' data: https://fonts.gstatic.com` уже разрешает локальные шрифты с origin сайта.
3. **Сжатие Nitro**: Включено `nitro.compressPublicAssets: true`, поэтому статические файлы из `public/` отдаются
   сжатыми (Brotli/Gzip).
