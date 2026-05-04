import { computed, defineComponent, h, mergeProps, useAttrs } from "vue";

/**
 * В Storybook нет Nuxt; для компонентов с NuxtLink — простой `<a>`.
 * Классы и data-атрибуты (в т.ч. scoped) должны попасть на корень — иначе стили не применятся.
 */
export const StorybookNuxtLinkShim = defineComponent({
	name: "StorybookNuxtLinkShim",
	inheritAttrs: false,
	props: { to: { type: [String, Object], required: true } },
	setup(props, { slots }) {
		const attrs = useAttrs();
		const href = computed(() => (typeof props.to === "string" ? props.to || "#" : "#"));
		return () =>
			h(
				"a",
				mergeProps(attrs, {
					href: href.value,
					onClick: (e: MouseEvent) => {
						e.preventDefault();
					},
				}),
				slots.default?.()
			);
	},
});
