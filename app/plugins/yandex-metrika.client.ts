/* eslint-disable no-console -- dev and diagnostic logging for metrics */
import { YANDEX_METRIKA_ID } from "~/config/metrics";
import { isMetricsTrackingEnabled } from "~/utils/isMetricsTrackingEnabled";
import { ensureYandexMetrikaGlobals } from "~/utils/yandexMetrikaGlobals";

/**
 * @description Яндекс.Метрика: очередь вызовов до загрузки tag.js (официальный сниппет
 *   https://yandex.ru/support/metrika/code/counter-initialize.html), инициализация
 *   счётчика и hit-хиты первого просмотра и SPA-переходов.
 */

export default defineNuxtPlugin(() => {
	ensureYandexMetrikaGlobals();

	if (!isMetricsTrackingEnabled()) {
		console.info("[Yandex.Metrika] отключена в dev/test-режиме");
		return;
	}

	// Инициализация счётчика (параметры перенесены из client-metrics.php Битрикса)
	window.ym?.(YANDEX_METRIKA_ID, "init", {
		ssr: true,
		clickmap: true,
		trackLinks: true,
		accurateTrackBounce: true,
		webvisor: true,
		trackHash: true,
		ecommerce: "dataLayer",
	});

	// Роутинг: первый hit и все SPA-переходы
	const router = useRouter();

	/**
	 * @description Ставит hit-просмотр в очередь Метрики с защитой от ошибок трекинга.
	 * @param {string} fullPath Полный путь маршрута для хита.
	 * @returns {void}
	 */
	function trackHit(fullPath: string): void {
		try {
			window.ym?.(YANDEX_METRIKA_ID, "hit", fullPath);
		} catch (err) {
			console.warn("Yandex.Metrika hit error:", err);
		}
	}

	// Отложенная загрузка скрипта Метрики после гидратации в свободное время потока
	onNuxtReady(() => {
		trackHit(router.currentRoute.value.fullPath);

		const loadScript = (): void => {
			if (document.getElementById("yandex-metrika-script")) return;
			cleanupInteractionListeners();
			const script = document.createElement("script");
			const anchor = document.getElementsByTagName("script")[0];
			script.async = true;
			script.src = `https://mc.yandex.ru/metrika/tag.js?id=${YANDEX_METRIKA_ID}`;
			script.id = "yandex-metrika-script";
			anchor?.parentNode?.insertBefore(script, anchor);
		};

		const INTERACTION_EVENTS = ["scroll", "touchstart", "pointerdown", "keydown", "wheel"] as const;

		let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

		const cleanupInteractionListeners = (): void => {
			if (fallbackTimer) {
				clearTimeout(fallbackTimer);
				fallbackTimer = null;
			}
			INTERACTION_EVENTS.forEach((event) => {
				window.removeEventListener(event, loadScript);
			});
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};

		const handleVisibilityChange = (): void => {
			if (document.visibilityState === "hidden") {
				loadScript();
			}
		};

		INTERACTION_EVENTS.forEach((event) => {
			window.addEventListener(event, loadScript, { once: true, passive: true });
		});
		document.addEventListener("visibilitychange", handleVisibilityChange, { once: true });

		fallbackTimer = setTimeout(() => {
			if (typeof window !== "undefined" && "requestIdleCallback" in window) {
				window.requestIdleCallback(loadScript);
			} else {
				loadScript();
			}
		}, 12000);
	});

	// Хиты при смене маршрута (SPA)
	router.afterEach((to) => trackHit(to.fullPath));
});
