import { ref, type Ref } from "vue";

const stateByKey = new Map<string, Ref<unknown>>();

/**
 * Упрощённая замена Nuxt `useState` для Storybook: общий процесс, без SSR и payload.
 */
export function useState<T>(key: string, init: () => T): Ref<T> {
	let entry = stateByKey.get(key) as Ref<T> | undefined;
	if (!entry) {
		entry = ref(init()) as Ref<T>;
		stateByKey.set(key, entry as Ref<unknown>);
	}
	return entry;
}

/** Заглушка для Storybook: реальный роутинг обеспечивает Nuxt на `import { navigateTo } from '#app'`. */
export function navigateTo(_to: unknown): Promise<void> {
	void _to;
	return Promise.resolve();
}
