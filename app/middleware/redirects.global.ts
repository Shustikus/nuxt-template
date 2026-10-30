import { resolveAppRedirect } from "~/config/redirects";

/**
 * Единый глобальный route middleware Nuxt:
 * перехватывает SPA-переходы по устаревшим или служебным URL и выполняет редирект (301).
 * Все правила централизованно задаются в app/config/redirects.ts.
 */
export default defineNuxtRouteMiddleware((to) => {
	const redirect = resolveAppRedirect(to.path);
	if (!redirect) return;

	return navigateTo(
		{ path: redirect.target, query: to.query, hash: to.hash },
		{ redirectCode: redirect.statusCode, external: false }
	);
});
