import { toValue, watch, type MaybeRefOrGetter } from "vue";

export interface UseOverlayBodyLockOptions {
	/** Закрытие по Escape (если нет своего `onKeydown`). */
	onEscape?: () => void;
	/** Полный обработчик клавиш (lightbox со стрелками и т.п.). */
	onKeydown?: (event: KeyboardEvent) => void;
	/** Доп. условие: lock только когда и overlay открыт, и `enabled === true`. */
	enabled?: MaybeRefOrGetter<boolean>;
	onActivate?: () => void;
	onDeactivate?: () => void;
}

/**
 * Блокирует скролл `body`, пока overlay/sheet открыт.
 * Опционально — Escape или свой `onKeydown`, колбэки активации (фокус).
 */
export function useOverlayBodyLock(isActive: MaybeRefOrGetter<boolean>, options: UseOverlayBodyLockOptions = {}): void {
	watch(
		() => {
			const active = Boolean(toValue(isActive));
			if (!active) return false;
			if (options.enabled === undefined) return true;
			return Boolean(toValue(options.enabled));
		},
		(locked, _wasLocked, onCleanup) => {
			if (!locked || !import.meta.client) return;

			const previousOverflow = document.body.style.overflow;
			document.body.style.overflow = "hidden";

			const handleKeydown =
				options.onKeydown ??
				((event: KeyboardEvent) => {
					if (event.key !== "Escape") return;
					options.onEscape?.();
				});

			const bindsKeyboard = Boolean(options.onKeydown || options.onEscape);
			if (bindsKeyboard) {
				document.addEventListener("keydown", handleKeydown);
			}

			options.onActivate?.();

			onCleanup(() => {
				document.body.style.overflow = previousOverflow;
				if (bindsKeyboard) {
					document.removeEventListener("keydown", handleKeydown);
				}
				options.onDeactivate?.();
			});
		},
		{ immediate: true }
	);
}
