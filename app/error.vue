<template>
	<NuxtLayout>
		<section class="error-page">
			<div class="error-page__container">
				<div class="error-page__code">{{ statusCode }}</div>

				<h1 class="error-page__title">{{ text.title }}</h1>

				<p class="error-page__description">{{ text.lead }}</p>

				<p
					v-if="extraMessage"
					class="error-page__extra"
				>
					{{ extraMessage }}
				</p>

				<p
					v-if="isDev"
					class="error-page__debug"
				>
					{{ debugLine }}
				</p>

				<div class="error-page__actions">
					<button
						type="button"
						class="error-page__button error-page__button--primary"
						@click="handleGoHome"
					>
						На главную
					</button>
					<button
						type="button"
						class="error-page__button"
						@click="handleGoBack"
					>
						Назад
					</button>
				</div>
			</div>
		</section>
	</NuxtLayout>
</template>

<script setup lang="ts">
import type { NuxtError } from "#app";

type ErrorCopy = { title: string; lead: string };

const props = defineProps<{ error: NuxtError }>();

const isDev = import.meta.dev;

const BY_CODE: Partial<Record<number, ErrorCopy>> = {
	401: { title: "Требуется авторизация", lead: "Войдите в аккаунт, чтобы открыть этот раздел." },
	403: { title: "Доступ запрещён", lead: "У вас нет прав для просмотра этой страницы." },
	404: { title: "Страница не найдена", lead: "Проверьте адрес страницы или вернитесь на главную." },
	429: { title: "Слишком много запросов", lead: "Подождите немного и повторите попытку." },
	503: { title: "Сервис недоступен", lead: "Сейчас ведутся работы или высокая нагрузка. Попробуйте позже." },
	504: { title: "Таймаут", lead: "Сервер не ответил вовремя. Обновите страницу через минуту." },
};

const CLIENT_FALLBACK: ErrorCopy = {
	title: "Запрос не выполнен",
	lead: "Проверьте данные и попробуйте снова. При необходимости обратитесь в поддержку.",
};

const SERVER_FALLBACK: ErrorCopy = {
	title: "Ошибка сервера",
	lead: "Что-то сломалось на нашей стороне. Обновите страницу позже.",
};

function resolveCopy(code: number): ErrorCopy {
	const exact = BY_CODE[code];
	if (exact) return exact;
	if (code >= 400 && code < 500) return CLIENT_FALLBACK;
	if (code >= 500) return SERVER_FALLBACK;
	return { title: "Ошибка", lead: "Попробуйте обновить страницу или перейти на главную." };
}

function normalizeStatusCode(raw: unknown): number {
	if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
		return Math.trunc(raw);
	}
	return 500;
}

const statusCode = computed(() => normalizeStatusCode(props.error.statusCode));

const text = computed(() => resolveCopy(statusCode.value));

const rawMessage = computed(() => {
	const m = props.error.message;
	return typeof m === "string" ? m.trim() : "";
});

function clampDetail(s: string, max = 240): string {
	if (s.length <= max) return s;
	return `${s.slice(0, max - 1)}…`;
}

const extraMessage = computed(() => {
	const msg = rawMessage.value;
	if (!msg || statusCode.value >= 500) return "";
	const t = text.value.title.toLowerCase();
	if (msg.toLowerCase() === t) return "";
	return clampDetail(msg);
});

const debugLine = computed(() =>
	[statusCode.value, props.error.statusMessage, rawMessage.value].filter(Boolean).join(" · ")
);

const metaDescription = computed(() => [text.value.lead, extraMessage.value].filter(Boolean).join(" ").slice(0, 320));

useSeoMeta({ title: () => text.value.title, description: () => metaDescription.value, robots: "noindex,follow" });

function handleGoHome() {
	clearError({ redirect: "/" });
}

function handleGoBack() {
	clearError();
	if (import.meta.client && window.history.length > 1) {
		window.history.back();
		return;
	}
	void navigateTo("/");
}
</script>

<style scoped>
.error-page {
	display: flex;
	align-items: center;
	min-height: 60vh;
	padding: 3rem 0;
}

.error-page__container {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	max-width: 560px;
}

.error-page__code {
	color: var(--color-accent);
	font-size: 4.5rem;
	font-weight: 700;
	line-height: 1;
	letter-spacing: -0.04em;
}

.error-page__title {
	margin: 0;
	font-size: 1.75rem;
	color: var(--color-text);
}

.error-page__description {
	margin: 0;
	color: var(--color-muted);
}

.error-page__extra {
	margin: 0;
	color: var(--color-muted);
}

.error-page__debug {
	margin: 0;
	padding: 0.75rem;
	border-radius: var(--radius-md);
	background: var(--color-muted-bg);
	color: var(--color-muted);
	font-size: 0.875rem;
	word-break: break-word;
}

.error-page__actions {
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
}

.error-page__button {
	padding: 0.625rem 1.25rem;
	border: 1px solid var(--color-border);
	border-radius: var(--radius-md);
	background: var(--color-bg);
	color: var(--color-text);
	font: inherit;
	cursor: pointer;
}

.error-page__button--primary {
	border-color: var(--color-accent);
	background: var(--color-accent);
	color: #fff;
}

@media (max-width: 480px) {
	.error-page {
		padding: 2rem 0;
	}

	.error-page__code {
		font-size: 3.5rem;
	}

	.error-page__actions {
		flex-direction: column;
	}

	.error-page__button {
		width: 100%;
	}
}
</style>
