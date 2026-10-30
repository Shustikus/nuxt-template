import { YANDEX_METRIKA_ID } from "~/config/metrics";
import type { YandexMetrikaConstructor, YandexMetrikaFn, YandexMetrikaInstance } from "~/types/client-metrics";

/**
 * @description Инициализирует глобальные объекты Яндекс.Метрики (`window.ym` и `window.Ya`),
 *   предотвращая ошибки `ReferenceError: Ya is not defined` и `TypeError: Ya.Metrika.counters is not a function`
 *   в сторонних виджетах (Roistat, CRM), видеоплеерах и партнерских скриптах
 *   до или без загрузки tag.js (dev/adblock/SSR/тесты).
 */
export function ensureYandexMetrikaGlobals(): void {
	if (typeof window === "undefined") return;

	// Контейнер ecommerce-событий (promoView/promoClick)
	window.dataLayer = window.dataLayer || [];

	// Очередь ym(...) по официальному сниппету Яндекс.Метрики
	if (!window.ym) {
		const queue: YandexMetrikaFn = (...args) => {
			queue.a = queue.a ?? [];
			queue.a.push(args);
		};
		window.ym = queue;
		window.ym.l = Date.now();
	}

	// Заглушка для глобального объекта Ya (Ya.Metrika / Ya.Metrika2 / Ya._metrika),
	// которого требуют сторонние интеграции (Roistat, stat_api и т.д.)
	const createMetrikaInstance = (counterId: number = YANDEX_METRIKA_ID): YandexMetrikaInstance => ({
		id: counterId,
		reachGoal: () => {},
		userParams: () => {},
		hit: () => {},
		params: () => {},
		extLink: () => {},
		file: () => {},
		notBounce: () => {},
		addFileExtension: () => {},
		getClientID: (cb?: (id: string) => void) => cb?.("dev-client-id"),
	});

	const defaultCounter = createMetrikaInstance(YANDEX_METRIKA_ID);

	const ya = (window.Ya = window.Ya || {});
	const metrikaStorage = (ya._metrika = ya._metrika || {});
	const countersMap = (metrikaStorage.counters = metrikaStorage.counters || {});
	countersMap[YANDEX_METRIKA_ID] = countersMap[YANDEX_METRIKA_ID] || defaultCounter;

	const getCounters = (): YandexMetrikaInstance[] => {
		const list = Object.values(countersMap);
		return list.length > 0 ? list : [defaultCounter];
	};

	const createMetrikaConstructor = (): YandexMetrikaConstructor => {
		function MetrikaCtor(this: unknown, id?: number | string): YandexMetrikaInstance {
			const numericId = Number(id) || YANDEX_METRIKA_ID;
			const instance = Object.assign(this instanceof MetrikaCtor ? this : {}, createMetrikaInstance(numericId));
			countersMap[numericId] = instance;
			return instance;
		}
		MetrikaCtor.counters = getCounters;
		return MetrikaCtor as unknown as YandexMetrikaConstructor;
	};

	if (!ya.Metrika) {
		ya.Metrika = createMetrikaConstructor();
	} else if (typeof ya.Metrika.counters !== "function") {
		ya.Metrika.counters = getCounters;
	}

	if (!ya.Metrika2) {
		ya.Metrika2 = createMetrikaConstructor();
	} else if (typeof ya.Metrika2.counters !== "function") {
		ya.Metrika2.counters = getCounters;
	}
}
