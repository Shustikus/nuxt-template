/**
 * Конфигурация ESLint (flat config).
 *
 * Vue + TypeScript через @vue/eslint-config-typescript (дефолтный экспорт — createConfig),
 * правила Vue recommended, интеграция Prettier через @vue/eslint-config-prettier.
 */
import pluginVue from "eslint-plugin-vue";
import createVueTsConfig from "@vue/eslint-config-typescript";
import vuePrettierEslintConfig from "@vue/eslint-config-prettier";

export default [
	{ ignores: [".output/**", ".nuxt/**", "node_modules/**", "dist/**", "coverage/**", "storybook-static/**"] },
	...pluginVue.configs["flat/recommended"],
	...createVueTsConfig(),
	vuePrettierEslintConfig,
	{
		rules: {
			"no-console": "warn", // Предупреждение при console.log (не ошибка)
			"no-debugger": "error", // Запрет debugger в коде
			"@typescript-eslint/no-unused-vars": "error", // Неиспользуемые переменные — ошибка
			"vue/multi-word-component-names": "off", // Разрешаем однословные имена компонентов
		},
	},
];
