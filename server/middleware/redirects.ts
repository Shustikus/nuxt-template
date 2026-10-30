import { defineEventHandler, getRequestURL, sendRedirect } from "h3";
import { resolveAppRedirect } from "../../app/config/redirects";

/**
 * Единый Nitro middleware для всех серверных HTTP-редиректов проекта (SEO 301/302).
 * Правила и маски централизованно задаются в app/config/redirects.ts.
 */
export default defineEventHandler((event) => {
	const { pathname, search } = getRequestURL(event);

	const redirect = resolveAppRedirect(pathname);
	if (!redirect) return;

	const target = search
		? `${redirect.target}${redirect.target.includes("?") ? "&" : "?"}${search.replace(/^\?/, "")}`
		: redirect.target;

	return sendRedirect(event, target, redirect.statusCode);
});
