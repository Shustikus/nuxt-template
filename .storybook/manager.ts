import { addons } from "storybook/manager-api";
import { theme } from "./theme";

addons.setConfig({
	theme,
	sidebar: { showRoots: true },
	toolbar: {
		zoom: { hidden: false },
		eject: { hidden: false },
		copy: { hidden: false },
		fullscreen: { hidden: false },
	},
});
