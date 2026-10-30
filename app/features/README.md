# Архитектура фичей (Feature-Sliced Design)

Директория [`app/features/`](file:///home/mihail/projects/nuxt-template/app/features) предназначена для изоляции
бизнес-логики приложения по методологии **Feature-Sliced Design (FSD)**, адаптированной под Nuxt 4.

Каждая подпапка внутри `features/` представляет собой самостоятельную бизнес-фичу (слайс) с явным публичным интерфейсом.

---

## 1. Рекомендуемая структура фичи

```text
app/features/<feature-name>/
  ├── components/          # Vue-компоненты фичи (формы, виджеты, тулбары)
  ├── composables/         # Реактивное состояние и логика (Composition API)
  ├── services/            # Запросы к API (через apiFetch) и внешние сервисы
  ├── dto/                 # Типы данных бэкенда (Data Transfer Objects)
  ├── mappers/             # Чистые функции преобразования DTO в UI-модели
  ├── types/               # Внутренние типы, интерфейсы и константы фичи
  └── index.ts             # Public API фичи (ЕДИНСТВЕННАЯ точка входа)
```

> [!NOTE] Не обязательно создавать все подпапки сразу: для небольших фичей достаточно `components/`, `composables/` и
> `index.ts`. Создавайте слои по мере усложнения бизнес-логики.

---

## 2. Ключевые правила взаимодействия

1. **Изоляция и Public API (`index.ts`)**:
   - Любой внешний модуль (страница в `app/pages/`, другая фича или лэйаут) должен импортировать сущности фичи
     **только** через её `index.ts`:
     ```typescript
     // ✅ Правильно: импорт через публичный контракт
     import { FeedbackForm, useFeedback } from "~/features/feedback";

     // ❌ Запрещено: обращение к внутренним файлам в обход index.ts
     import FeedbackForm from "~/features/feedback/components/FeedbackForm.vue";
     ```
2. **Горизонтальные зависимости**:
   - Фичи одного уровня не должны импортировать приватные внутренности друг друга.
   - Если двум фичам нужен одинаковый интерфейс, UI-элемент или утилита — выносите общее на уровень ниже:
     - Общие UI-компоненты: [`app/components/ui/`](file:///home/mihail/projects/nuxt-template/app/components/ui)
     - Общие утилиты: [`app/shared/utils/`](file:///home/mihail/projects/nuxt-template/app/shared/utils) или
       [`app/utils/`](file:///home/mihail/projects/nuxt-template/app/utils)
     - Общие composables: [`app/composables/`](file:///home/mihail/projects/nuxt-template/app/composables)
3. **Именование**:
   - Названия фичей оформляются в `kebab-case` (например, `feedback-form`, `catalog-filter`, `user-profile`).
   - Имена компонентов — `PascalCase` с префиксом предметной области фичи (например, `FeedbackModal.vue`,
     `FeedbackSuccess.vue`).

---

## 3. Пример минимальной фичи

### Шаг 1. Сервис запроса (`services/feedbackApi.ts`)

```typescript
import { apiFetch } from "~/utils/apiFetch";
import type { FeedbackPayload, FeedbackResponse } from "../types";

export function sendFeedback(payload: FeedbackPayload): Promise<FeedbackResponse> {
	return apiFetch<FeedbackResponse>("/feedback", { method: "POST", body: payload });
}
```

### Шаг 2. Composable состояния (`composables/useFeedback.ts`)

```typescript
import { ref } from "vue";
import { sendFeedback } from "../services/feedbackApi";
import type { FeedbackPayload } from "../types";

export function useFeedback() {
	const isSubmitting = ref(false);
	const error = ref<string | null>(null);

	async function submit(data: FeedbackPayload) {
		isSubmitting.value = true;
		error.value = null;
		try {
			return await sendFeedback(data);
		} catch (err) {
			error.value = "Не удалось отправить заявку";
			throw err;
		} finally {
			isSubmitting.value = false;
		}
	}

	return { isSubmitting, error, submit };
}
```

### Шаг 3. Компонент (`components/FeedbackForm.vue`)

```vue
<template>
	<form
		class="feedback-form"
		@submit.prevent="handleSubmit"
	>
		<input
			v-model="name"
			placeholder="Ваше имя"
			required
		/>
		<button
			type="submit"
			:disabled="isSubmitting"
		>
			{{ isSubmitting ? "Отправка..." : "Отправить" }}
		</button>
		<p
			v-if="error"
			class="error"
		>
			{{ error }}
		</p>
	</form>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useFeedback } from "../composables/useFeedback";

const name = ref("");
const { isSubmitting, error, submit } = useFeedback();

async function handleSubmit() {
	await submit({ name: name.value });
	name.value = "";
}
</script>
```

### Шаг 4. Экспорт через Public API (`index.ts`)

```typescript
export { default as FeedbackForm } from "./components/FeedbackForm.vue";
export { useFeedback } from "./composables/useFeedback";
export type { FeedbackPayload, FeedbackResponse } from "./types";
```

Теперь компонент доступен для использования на любой странице:

```vue
<script setup lang="ts">
import { FeedbackForm } from "~/features/feedback";
</script>

<template>
	<FeedbackForm />
</template>
```
