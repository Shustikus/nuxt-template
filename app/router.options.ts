import type { RouterConfig } from "@nuxt/schema";
import { START_LOCATION, type RouteRecordRaw } from "vue-router";
import routesConfig from "~/config/routes";
import type { ManagedRoute } from "~/config/routes";
import { isVitest } from "~/utils/isVitest";

export function buildManagedRoutes(
	generatedRoutes: readonly RouteRecordRaw[],
	managedRoutes: readonly ManagedRoute[]
): RouteRecordRaw[] {
	const componentMap = new Map<string, RouteRecordRaw>();

	function collectRoutes(routes: readonly RouteRecordRaw[]) {
		for (const route of routes) {
			if (route.name) {
				componentMap.set(String(route.name), route);
			}
			if (route.children?.length) {
				collectRoutes(route.children);
			}
		}
	}

	collectRoutes(generatedRoutes);

	return managedRoutes.flatMap((entry) => {
		const base = componentMap.get(entry.page);
		if (!base?.component) return [];

		return [
			{
				...base,
				path: entry.path,
				name: entry.name,
				meta: { ...base.meta, ...entry.meta },
				component: base.component,
				children: [],
			} as RouteRecordRaw,
		];
	});
}

/**
 * Кастомная конфигурация Vue Router для управляемого роутинга.
 *
 * Заменяет стандартные file-based маршруты Nuxt на маршруты
 * из `app/config/routes.ts`. Это позволяет маркетингу менять URL
 * страниц без изменения кода компонентов.
 *
 * @see https://nuxt.com/docs/guide/going-further/custom-routing#router-options
 */
export default <RouterConfig>{
	/**
	 * Переопределяет маршруты, сгенерированные Nuxt.
	 *
	 * Берёт авто-сгенерированные маршруты (с компонентами),
	 * индексирует их по имени и собирает финальную таблицу маршрутов
	 * из managed-конфигурации, подставляя URL из `routes.ts`.
	 *
	 * @param _routes - Авто-сгенерированные Nuxt маршруты (file-based)
	 * @returns Массив маршрутов с URL из managed-конфигурации
	 */
	routes(_routes: readonly RouteRecordRaw[]) {
		// Запись без Nuxt-компонента не должна попадать в Vue Router:
		// иначе переход завершится маршрутом с `component: undefined`.
		return buildManagedRoutes(_routes, routesConfig);
	},

	/**
	 * Управление скроллом при переходах.
	 * Не скроллит при смене query-параметров или одинаковых нормализованных путях
	 * (включая percent-encoded сегменты фильтров), предотвращая скачки к началу страницы
	 * при клике на «Показать ещё».
	 *
	 * При переходе на другую страницу или навигации назад дожидается окончания
	 * загрузки страницы (`page:loading:end` + requestAnimationFrame), чтобы восстановить
	 * позицию скролла на уже отрендеренном DOM, предотвращая сброс в top: 0.
	 */
	scrollBehavior(to, from, savedPosition) {
		const normalizePath = (path: string): string => {
			try {
				return decodeURIComponent(path).replace(/\/$/, "");
			} catch {
				return path.replace(/\/$/, "");
			}
		};

		const nuxtApp = typeof useNuxtApp === "function" ? useNuxtApp() : undefined;
		const router = typeof useRouter === "function" ? useRouter() : undefined;
		const hashScrollBehaviour =
			((router?.options as Record<string, unknown> | undefined)?.scrollBehaviorType as ScrollBehavior | undefined) ??
			"auto";

		function getHashElementScrollMarginTop(selector: string): number {
			try {
				const elem = document.querySelector(selector);
				if (elem) {
					return (
						(Number.parseFloat(getComputedStyle(elem).scrollMarginTop) || 0) +
						(Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0)
					);
				}
			} catch {}
			return 0;
		}

		type HashScrollPosition = { el: string; top?: number; behavior: ScrollBehavior } | false;

		function createHashPosition(
			selector: string,
			scrollMode: ScrollBehavior = "auto"
		): { el: string; top?: number; behavior: ScrollBehavior } {
			const top = getHashElementScrollMarginTop(selector);
			return top > 0 ? { el: selector, top, behavior: scrollMode } : { el: selector, behavior: scrollMode };
		}

		function getHashPosition(
			selector: string,
			scrollMode: ScrollBehavior = "auto"
		): HashScrollPosition | Promise<HashScrollPosition> {
			if (typeof document === "undefined") {
				return { el: selector, behavior: scrollMode };
			}

			try {
				const elem = document.querySelector(selector);
				if (elem) {
					return createHashPosition(selector, scrollMode);
				}
			} catch {
				return false;
			}

			if (isVitest()) {
				return createHashPosition(selector, scrollMode);
			}

			return new Promise<HashScrollPosition>((resolve) => {
				requestAnimationFrame(() => {
					try {
						const nextElem = document.querySelector(selector);
						resolve(nextElem ? createHashPosition(selector, scrollMode) : false);
					} catch {
						resolve(false);
					}
				});
			});
		}

		function calculatePosition(targetRoute: typeof to, pos: typeof savedPosition, scrollMode: ScrollBehavior = "auto") {
			if (pos) return pos;
			if (targetRoute.hash) {
				return getHashPosition(targetRoute.hash, scrollMode);
			}
			return { left: 0, top: 0 };
		}

		if (normalizePath(to.path) === normalizePath(from.path)) {
			if (from.hash && !to.hash) {
				return savedPosition ?? { left: 0, top: 0 };
			}
			if (to.hash) {
				return getHashPosition(to.hash, hashScrollBehaviour);
			}
			return false;
		}

		if (
			(typeof to.meta?.scrollToTop === "function"
				? (to.meta.scrollToTop as (t: typeof to, f: typeof from) => boolean)(to, from)
				: to.meta?.scrollToTop) === false
		) {
			return false;
		}

		if (!nuxtApp || !router || from === START_LOCATION) {
			return calculatePosition(to, savedPosition, hashScrollBehaviour);
		}

		return new Promise((resolve) => {
			let resolved = false;
			const doScroll = () => {
				if (resolved) return;
				resolved = true;
				requestAnimationFrame(async () => {
					if (router.currentRoute.value.fullPath !== to.fullPath) {
						resolve(false);
						return;
					}
					resolve(await calculatePosition(to, savedPosition, hashScrollBehaviour));
				});
			};

			const unsub = nuxtApp.hooks.hookOnce("page:loading:end", () => {
				const transitionPromise = (nuxtApp as unknown as { "~transitionPromise"?: Promise<void> })[
					"~transitionPromise"
				];
				if (transitionPromise) {
					transitionPromise.then(doScroll);
				} else {
					doScroll();
				}
			});

			// Страховочный таймаут, если хук не вызвался (например, при мгновенном переходе или в тестах)
			setTimeout(() => {
				if (!resolved) {
					unsub();
					doScroll();
				}
			}, 500);
		});
	},
};
