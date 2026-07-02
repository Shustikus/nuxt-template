import type { Plugin } from "vite";

/** Подменяет Nuxt-флаги import.meta.* в unit-тестах без полного Nuxt runtime. */
export function nuxtImportMetaShim(): Plugin {
	return {
		name: "nuxt-import-meta-shim",
		enforce: "pre",
		transform(code, id) {
			if (id.includes("node_modules") || !code.includes("import.meta.")) return null;

			const next = code.replaceAll("import.meta.client", "true").replaceAll("import.meta.server", "false");

			return next === code ? null : { code: next, map: null };
		},
	};
}
