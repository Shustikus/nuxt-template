import iconSet from "@iconify-json/mdi/icons.json";
import { computed, defineComponent, h } from "vue";

type IconSet = {
	icons: Record<string, { body: string; width?: number; height?: number }>;
	width?: number;
	height?: number;
};

const typedMdiIconSet = iconSet as IconSet;
export const StorybookIconShim = defineComponent({
	name: "StorybookIconShim",
	props: { name: { type: String, required: true }, size: { type: [String, Number], default: "1em" } },
	setup(props, { attrs }) {
		const parsedIcon = computed(() => {
			if (props.name.startsWith("mdi:")) {
				return { iconSet: typedMdiIconSet, token: props.name.slice(4) };
			}

			return { iconSet: typedMdiIconSet, token: props.name };
		});
		const body = computed(() => parsedIcon.value.iconSet.icons[parsedIcon.value.token]?.body ?? "");
		const viewBox = computed(() => {
			const iconData = parsedIcon.value.iconSet.icons[parsedIcon.value.token];
			const width = iconData?.width ?? parsedIcon.value.iconSet.width ?? 24;
			const height = iconData?.height ?? parsedIcon.value.iconSet.height ?? 24;
			return `0 0 ${width} ${height}`;
		});
		const resolvedSize = computed(() => (typeof props.size === "number" ? `${props.size}px` : props.size));

		return () =>
			h("svg", {
				...attrs,
				"viewBox": viewBox.value,
				"width": resolvedSize.value,
				"height": resolvedSize.value,
				"fill": "none",
				"innerHTML": body.value,
				"aria-hidden": "true",
			});
	},
});
