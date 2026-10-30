import { MINIMUM_BROWSER_VERSIONS } from "../../app/constants/browserSupport";

function getBrowserVersion(userAgent: string, expression: RegExp): number | null {
	const version = expression.exec(userAgent)?.[1];

	return version ? Number.parseFloat(version) : null;
}

/**
 * Определяет браузеры, не поддерживающие поставляемый Nuxt-клиент.
 * Проверка выполняется на сервере до загрузки несовместимого JavaScript.
 * Неопознанные user-agent не блокируем.
 */
export function isLegacyBrowser(userAgent: string): boolean {
	if (!userAgent) return false;

	// Internet Explorer (включая мобильный) и EdgeHTML не умеют ES-модули.
	if (/(?:MSIE\s|Trident\/|IEMobile\/|Edge\/)/i.test(userAgent)) return true;

	// Opera Mini рендерит страницы через прокси и не выполняет современный JS.
	if (/Opera Mini/i.test(userAgent)) return true;

	const chromiumVersion = getBrowserVersion(userAgent, /(?:Chrome|Chromium|CriOS|HeadlessChrome)\/(\d+(?:\.\d+)?)/i);

	if (chromiumVersion !== null) {
		return chromiumVersion < MINIMUM_BROWSER_VERSIONS.chromium;
	}

	const firefoxVersion = getBrowserVersion(userAgent, /(?:Firefox|FxiOS)\/(\d+(?:\.\d+)?)/i);

	if (firefoxVersion !== null) {
		return firefoxVersion < MINIMUM_BROWSER_VERSIONS.firefox;
	}

	// В Safari Version/ — версия движка; Chrome, Edge и Opera были исключены выше.
	if (/Safari\//i.test(userAgent)) {
		const safariVersion = getBrowserVersion(userAgent, /Version\/(\d+(?:\.\d+)?)/i);

		return safariVersion !== null && safariVersion < MINIMUM_BROWSER_VERSIONS.safari;
	}

	return false;
}
