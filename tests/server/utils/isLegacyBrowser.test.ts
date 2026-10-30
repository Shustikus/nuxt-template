import { describe, expect, it } from "vitest";
import { isLegacyBrowser } from "../../../server/utils/isLegacyBrowser";

describe("isLegacyBrowser", () => {
	it.each([
		["Internet Explorer 11", "Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko"],
		["Internet Explorer Mobile", "Mozilla/5.0 (Windows Phone 8.1; IEMobile/11.0) like Gecko"],
		["EdgeHTML", "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Edge/18.19041"],
		["Opera Mini", "Opera/9.80 (Android; Opera Mini/36.2.2254/191.283; U; ru) Presto/2.12.423"],
		["старый Chrome", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/89.0.0.0 Safari/537.36"],
		[
			"старый Яндекс Браузер на Chromium",
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/89.0.0.0 YaBrowser/21.1 Safari/537.36",
		],
		["старый Firefox", "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0"],
		[
			"старый Safari",
			"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/13.1 Safari/605.1.15",
		],
	])("считает неподдерживаемым: %s", (_name, userAgent) => {
		expect(isLegacyBrowser(userAgent)).toBe(true);
	});

	it.each([
		["актуальный Chrome", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/90.0.0.0 Safari/537.36"],
		[
			"актуальный Edge",
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/90.0.0.0 Safari/537.36 Edg/90.0.0.0",
		],
		["актуальный Firefox", "Mozilla/5.0 (X11; Linux x86_64; rv:90.0) Gecko/20100101 Firefox/90.0"],
		[
			"актуальный Safari",
			"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/14.0 Safari/605.1.15",
		],
		[
			"поисковый робот",
			"Mozilla/5.0 AppleWebKit/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html) Safari/537.36",
		],
		[
			"Safari без версии движка",
			"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15",
		],
		["curl консольный клиент", "curl/8.1.2"],
		["пустой User-Agent", ""],
	])("не блокирует: %s", (_name, userAgent) => {
		expect(isLegacyBrowser(userAgent)).toBe(false);
	});
});
