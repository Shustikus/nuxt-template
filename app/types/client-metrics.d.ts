/** Тип window.ym: очередь вызовов счётчика Яндекс.Метрики до и после загрузки tag.js. */
export type YandexMetrikaFn = ((...args: [counterId: number, method: string, ...params: unknown[]]) => void) & {
	/** Очередь вызовов, проигрываемая tag.js после загрузки (официальный сниппет). */
	a?: unknown[];
	/** Метка времени инициализации счётчика (официальный сниппет). */
	l?: number;
};

/** Элемент очереди счётчика Top.Mail.Ru (window._tmr). */
export interface TopMailRuQueueItem {
	id: number | string;
	type: string;
	start?: number;
	[key: string]: unknown;
}

/** Экземпляр счётчика Яндекс.Метрики (заглушка или реальный объект tag.js). */
export interface YandexMetrikaInstance {
	id?: number;
	reachGoal?: (target: string, params?: unknown, callback?: () => void, ctx?: unknown) => void;
	userParams?: (params: unknown) => void;
	hit?: (url?: string, options?: unknown) => void;
	params?: (params: unknown) => void;
	extLink?: (url: string, options?: unknown) => void;
	file?: (url: string, options?: unknown) => void;
	notBounce?: (options?: unknown) => void;
	addFileExtension?: (ext: string) => void;
	getClientID?: (cb?: (id: string) => void) => void;
	[key: string]: unknown;
}

/** Конструктор счётчика Яндекс.Метрики со статическим методом counters(). */
export interface YandexMetrikaConstructor {
	new (id?: number | string): YandexMetrikaInstance;
	(id?: number | string): YandexMetrikaInstance;
	counters?: () => YandexMetrikaInstance[];
	[key: string]: unknown;
}

/** Глобальный контейнер Яндекс (window.Ya). */
export interface YandexMetrikaGlobal {
	Metrika?: YandexMetrikaConstructor;
	Metrika2?: YandexMetrikaConstructor;
	_metrika?: { counters?: Record<string | number, YandexMetrikaInstance>; [key: string]: unknown };
	[key: string]: unknown;
}

/** Интерфейс дочернего компонента Diginetica Instant Search. */
export interface DigineticaInstantSearchApp {
	handleInputs?: (inputs: HTMLInputElement[]) => void;
	applyInputShims?: () => void;
	initInstantSearch?: () => Promise<void>;
	openFromApi?: (term?: string) => Promise<boolean>;
	handleFocus?: () => void;
	inputShimEnabled?: boolean;
	_inputShims?: unknown[];
	[key: string]: unknown;
}

/** Корневой Vue-инстанс Diginetica Instant Search (window.digiInstantSearch). */
export interface DigineticaInstantSearchRoot {
	$children?: DigineticaInstantSearchApp[];
	$destroy?: () => void;
	[key: string]: unknown;
}

/** Глобальный контейнер API Diginetica (window.Digi). */
export interface DigineticaGlobal {
	instantSearch?: { open?: (term?: string) => Promise<boolean> };
	config?: Record<string, unknown>;
	[key: string]: unknown;
}

declare global {
	interface Window {
		/** Очередь счётчика Яндекс.Метрики до и после загрузки tag.js. */
		ym?: YandexMetrikaFn;
		/** Очередь счётчика Top.Mail.Ru до и после загрузки code.js. */
		_tmr?: TopMailRuQueueItem[];
		/** Контейнер ecommerce-событий Яндекс.Метрики (promoView/promoClick и т.п.). */
		dataLayer?: unknown[];
		/** Контейнер и конструктор Яндекс.Метрики (Ya.Metrika / Ya.Metrika2). */
		Ya?: YandexMetrikaGlobal;
		/** Параметры интеграции Roistat (официальный сниппет из client-metrics.php). */
		roistatProjectId?: string;
		roistatHost?: string;
		roistatPage?: string;
		roistatReferrer?: string;
		/** Корневой инстанс Vue Diginetica Instant Search. */
		digiInstantSearch?: DigineticaInstantSearchRoot;
		/** Глобальный объект Diginetica API. */
		Digi?: DigineticaGlobal;
	}
}
