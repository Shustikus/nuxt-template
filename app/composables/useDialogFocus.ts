import { nextTick, ref, watch, type Ref } from "vue";

/**
 * Управление фокусом для оверлеев с `role="dialog" aria-modal="true"`:
 * при открытии фокус переносится в контейнер диалога, при закрытии
 * возвращается на элемент, с которого диалог открыли.
 *
 * Возвращает ref для привязки к контейнеру диалога (`tabindex="-1"`).
 */
export function useDialogFocus(isOpen: Ref<boolean>) {
	const containerRef = ref<HTMLElement | null>(null);
	let previouslyFocused: HTMLElement | null = null;

	if (import.meta.client) {
		watch(isOpen, async (open) => {
			if (open) {
				previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
				await nextTick();
				containerRef.value?.focus({ preventScroll: true });
				return;
			}

			if (previouslyFocused?.isConnected) {
				previouslyFocused.focus({ preventScroll: true });
			}
			previouslyFocused = null;
		});
	}

	return containerRef;
}
