import type { NuxtApp } from "#app";

type NuxtAsyncDataCacheContext = { cause?: string };

/** Читает кеш `useAsyncData` из payload Nuxt (SSR → клиент, повторные визиты). */
export function readNuxtAsyncDataCache<T>(
	key: string,
	nuxtApp: NuxtApp,
	context?: NuxtAsyncDataCacheContext
): T | undefined {
	// После мутаций Nuxt вызывает getCachedData с cause: "watch" — не подставляем устаревший payload.
	if (context?.cause && context.cause !== "initial") {
		return undefined;
	}

	return (nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]) as T | undefined;
}
