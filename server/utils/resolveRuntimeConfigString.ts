/** Читает строку из runtimeConfig с fallback на env (Vitest без Nuxt-контекста). */
export function resolveRuntimeConfigString(configKey: string, envKey: string, fallback = ""): string {
	try {
		const config = useRuntimeConfig() as Record<string, unknown>;
		const fromConfig = config[configKey];
		if (typeof fromConfig === "string" && fromConfig.trim().length > 0) {
			return fromConfig.trim();
		}
	} catch {
		// Vitest / импорт без Nuxt-контекста
	}

	if (envKey) {
		const fromEnv = String(process.env[envKey] ?? "").trim();
		if (fromEnv) return fromEnv;
	}

	return fallback;
}
