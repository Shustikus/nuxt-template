/** GET/POST через fetch без typed routes Nuxt — избегает TS «excessive stack depth». */
export type UntypedFetch = (url: string, options?: Record<string, unknown>) => Promise<unknown>;

export function asUntypedFetch(fetch: unknown): UntypedFetch {
	return fetch as UntypedFetch;
}
