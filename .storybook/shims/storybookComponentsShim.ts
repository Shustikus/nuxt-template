/**
 * Заглушка Nuxt `#components` для Storybook.
 * Реальный `NuxtLink` в preview регистрируется глобально; здесь — именованный экспорт
 * для SFC, которые импортируют `import { NuxtLink } from '#components'`.
 */
export { StorybookNuxtLinkShim as NuxtLink } from "./storybookNuxtLinkShim";
