import { ref, toValue, watch, type MaybeRefOrGetter } from "vue";

/**
 * Блокирует скролл страницы через `html/body.is-lock` и `position: fixed`,
 * чтобы фон не ехал под оверлеем и не прыгал после закрытия.
 */
export function useFixedBodyScrollLock(isActive: MaybeRefOrGetter<boolean>): void {
	const lockedScrollY = ref(0);

	watch(
		() => Boolean(toValue(isActive)),
		(locked, _wasLocked, onCleanup) => {
			if (!locked || !import.meta.client) return;

			lockedScrollY.value = window.scrollY;
			document.documentElement.classList.add("is-lock");
			document.body.style.top = `-${lockedScrollY.value}px`;
			document.body.classList.add("is-lock");

			onCleanup(() => {
				const scrollY = lockedScrollY.value;
				document.documentElement.classList.remove("is-lock");
				document.body.classList.remove("is-lock");
				document.body.style.top = "";
				window.scrollTo(0, scrollY);
			});
		},
		{ immediate: true }
	);
}
