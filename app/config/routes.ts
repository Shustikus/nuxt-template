/**
 * Управляемые маршруты: `routeRules` в `nuxt.config.ts` строятся из этого списка.
 *
 * `meta.renderMode`: `'ssr'` (по умолчанию) | `'ssg'` | `'spa'`
 */
export interface ManagedRoute {
	name: string;
	path: string;
	page: string;
	meta?: Record<string, unknown>;
}

const routes: ManagedRoute[] = [{ name: "home", path: "/", page: "index", meta: { title: "Главная" } }];

export default routes;
