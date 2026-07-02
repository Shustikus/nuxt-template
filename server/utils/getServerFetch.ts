import { $fetch as ofetch } from "ofetch";
import { asUntypedFetch } from "~/utils/untypedFetch";

/** Nitro `$fetch` на globalThis; fallback на ofetch (Vitest, ранний import). */
export function getServerFetch() {
	return asUntypedFetch((globalThis as { $fetch?: unknown }).$fetch ?? ofetch);
}
