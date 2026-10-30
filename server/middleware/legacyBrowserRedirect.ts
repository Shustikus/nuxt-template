import { appendResponseHeader, defineEventHandler, getRequestHeader, getRequestURL, sendRedirect } from "h3";
import { isLegacyBrowser } from "../utils/isLegacyBrowser";

const OLD_BROWSER_PATH = "/errors/old_browser/";

/**
 * Отдаём серверный экран до того, как браузер начнёт загружать несовместимое
 * Nuxt-приложение; сам экран остаётся доступен по URL.
 */
export default defineEventHandler((event) => {
	const userAgent = getRequestHeader(event, "user-agent") ?? "";
	const acceptsHtml = (getRequestHeader(event, "accept") ?? "").includes("text/html");
	const { pathname } = getRequestURL(event);

	if (
		!acceptsHtml ||
		pathname === OLD_BROWSER_PATH ||
		pathname === OLD_BROWSER_PATH.slice(0, -1) ||
		!isLegacyBrowser(userAgent)
	) {
		return;
	}

	// Кэшируемый ответ зависит от User-Agent: не даём прокси отдать redirect
	// современному браузеру, запросившему тот же URL.
	appendResponseHeader(event, "vary", "User-Agent");

	return sendRedirect(event, OLD_BROWSER_PATH, 302);
});
