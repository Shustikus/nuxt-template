/** Vitest выставляет `VITEST=true` в окружении тестового раннера. */
export function isVitest(): boolean {
	return process.env.VITEST === "true" || process.env.VITEST === "1";
}
