import { vi } from "vitest";

export type WebStorageMock = Storage & { store: Map<string, string> };

/** In-memory Storage для unit-тестов (localStorage / sessionStorage). */
export function createWebStorageMock(): WebStorageMock {
	const store = new Map<string, string>();

	return {
		store,
		get length() {
			return store.size;
		},
		clear() {
			store.clear();
		},
		getItem(key: string) {
			return store.get(key) ?? null;
		},
		setItem(key: string, value: string) {
			store.set(key, value);
		},
		removeItem(key: string) {
			store.delete(key);
		},
		key(index: number) {
			return [...store.keys()][index] ?? null;
		},
	};
}

export function stubLocalStorage(): WebStorageMock {
	const mock = createWebStorageMock();
	vi.stubGlobal("localStorage", mock);
	return mock;
}

export function stubSessionStorage(): WebStorageMock {
	const mock = createWebStorageMock();
	vi.stubGlobal("sessionStorage", mock);
	return mock;
}
