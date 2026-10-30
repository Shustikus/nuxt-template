import { defineNitroPlugin } from "nitropack/runtime/plugin";

/**
 * Удаляет паразитные теги <link rel="prefetch"> из HTML ответа SSR.
 * В Nuxt 3 по умолчанию генерируются сотни prefetch-ссылок для всех чанков проекта,
 * что на мобильных устройствах блокирует сеть и сильно снижает показатели Performance (LCP, Speed Index).
 */
export default defineNitroPlugin((nitroApp) => {
	nitroApp.hooks.hook("render:html", (htmlContext) => {
		if (Array.isArray(htmlContext.head)) {
			htmlContext.head = htmlContext.head.map((chunk) =>
				typeof chunk === "string" ? chunk.replace(/<link\s+[^>]*rel="prefetch"[^>]*>/gi, "") : chunk
			);
		}
	});
});
