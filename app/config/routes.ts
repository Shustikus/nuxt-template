/**
 * Описание управляемого маршрута.
 *
 * Маркетинг контролирует поле `path` (URL, который видит пользователь).
 * Разработчики добавляют новые записи при создании страниц в `app/pages/`.
 */
export interface ManagedRouteMeta {
	title?: string;
	description?: string;
	renderMode?: "ssr" | "ssg" | "spa";
}

export interface ManagedRoute {
	name: string;
	path: string;
	/** Имя Nuxt-страницы (file-based route name), например `index` */
	page: string;
	meta?: ManagedRouteMeta;
}

/**
 * Таблица маршрутов. Добавляйте записи вместе с новыми страницами.
 *
 * @example
 * {
 *   name: 'about',
 *   path: '/about',
 *   page: 'about',
 *   meta: { title: 'О нас', renderMode: 'ssg' },
 * }
 */
const routes: ManagedRoute[] = [{ name: "home", path: "/", page: "index", meta: { title: "Главная" } }];

export default routes;
