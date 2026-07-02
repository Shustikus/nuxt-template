import type { RouterConfig } from "@nuxt/schema";
import type { RouteRecordRaw } from "vue-router";
import routesConfig from "~/config/routes";

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

		collectRoutes(_routes);

		return routesConfig.map((entry) => {
			const base = componentMap.get(entry.page);

			return {
				...base,
				path: entry.path,
				name: entry.name,
				meta: { ...base?.meta, ...entry.meta },
				component: base?.component,
				children: [],
			} as RouteRecordRaw;
		});
	},
};
