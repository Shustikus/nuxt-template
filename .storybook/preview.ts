import type { Preview } from "@storybook/vue3-vite";
import { setup } from "@storybook/vue3";
import { createMemoryHistory, createRouter } from "vue-router";
import { StorybookNuxtLinkShim } from "./shims/storybookNuxtLinkShim";
import { theme } from "./theme";

import "../app/assets/styles/main.css";

setup((app) => {
	/**
	 * Storybook рендерит Vue без Nuxt-провайдеров.
	 * Добавляем минимальный router, чтобы useRoute()/useRouter() работали в компонентах.
	 */
	const router = createRouter({
		history: createMemoryHistory(),
		routes: [{ path: "/", name: "storybook-root", component: { template: "<div />" } }],
	});

	app.use(router);
	app.component("NuxtLink", StorybookNuxtLinkShim);
});

/**
 * Глобальные настройки Storybook preview.
 * @see https://storybook.js.org/docs/configure#configure-story-rendering
 */
const preview: Preview = {
	parameters: {
		a11y: {
			// Нарушения помечаются как TODO в панели Tests, не блокируя локальную разработку.
			test: "todo",
		},
		docs: { theme },
		controls: { matchers: { color: /(background|color)$/i, date: /Date$/i }, expanded: true },
		layout: "centered",
		options: {
			/**
			 * Сайдбар: введение → остальные сторис.
			 * @see https://storybook.js.org/docs/api/parameters#optionsstorysort
			 */
			storySort: { order: ["Введение", ["Welcome"], "*"] },
		},
	},
};

export default preview;
