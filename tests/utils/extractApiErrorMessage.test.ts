import { describe, expect, it } from "vitest";
import { FetchError } from "ofetch";
import { extractApiErrorMessage, resolveApiErrorStatus } from "~/utils/extractApiErrorMessage";

describe("extractApiErrorMessage", () => {
	it("извлекает ошибку из массива errors", () => {
		const err = { data: { errors: ["Ошибка валидации"] } };
		expect(extractApiErrorMessage(err)).toBe("Ошибка валидации");

		const errObj = { data: { errors: [{ message: "Объектная ошибка" }] } };
		expect(extractApiErrorMessage(errObj)).toBe("Объектная ошибка");

		const errEmpty = { data: { errors: [] } };
		expect(extractApiErrorMessage(errEmpty)).toBeUndefined();

		// Невалидные элементы в errors: пустая строка, объект без message, message не строка или пробелы
		expect(extractApiErrorMessage({ data: { errors: ["   "] } })).toBeUndefined();
		expect(extractApiErrorMessage({ data: { errors: [{}] } })).toBeUndefined();
		expect(extractApiErrorMessage({ data: { errors: [{ message: "   " }] } })).toBeUndefined();
		expect(extractApiErrorMessage({ data: { errors: [{ message: 123 }] } })).toBeUndefined();
	});

	it("извлекает detail или message из объекта", () => {
		expect(extractApiErrorMessage({ data: { detail: "Детальная ошибка" } })).toBe("Детальная ошибка");
		expect(extractApiErrorMessage({ data: { message: "Сообщение ошибки" } })).toBe("Сообщение ошибки");
		expect(extractApiErrorMessage({ message: "Топ-левел сообщение" })).toBe("Топ-левел сообщение");

		// Невалидный detail или message (пробелы, не строка)
		expect(extractApiErrorMessage({ data: { detail: "   " } })).toBeUndefined();
		expect(extractApiErrorMessage({ data: { detail: 123 } })).toBeUndefined();
		expect(extractApiErrorMessage({ data: { message: "   " } })).toBeUndefined();
		expect(extractApiErrorMessage({ data: { message: 456 } })).toBeUndefined();
		expect(extractApiErrorMessage({ message: "   " })).toBeUndefined();
		expect(extractApiErrorMessage({ message: 789 })).toBeUndefined();
	});

	it("обрабатывает FetchError из ofetch", () => {
		const fetchError = new FetchError("Network error");
		fetchError.data = { message: "Сообщение из FetchError" };
		expect(extractApiErrorMessage(fetchError)).toBe("Сообщение из FetchError");
	});

	it("возвращает undefined для пустых данных или объектов без валидных сообщений", () => {
		expect(extractApiErrorMessage(null)).toBeUndefined();
		expect(extractApiErrorMessage(undefined)).toBeUndefined();
		expect(extractApiErrorMessage({})).toBeUndefined();
		expect(extractApiErrorMessage({ data: { count: 42 } })).toBeUndefined();
		expect(extractApiErrorMessage({ data: "not-an-object" })).toBeUndefined();
		expect(extractApiErrorMessage("string error without message property")).toBeUndefined();
	});
});

describe("resolveApiErrorStatus", () => {
	it("определяет statusCode или status", () => {
		expect(resolveApiErrorStatus({ statusCode: 404 })).toBe(404);
		expect(resolveApiErrorStatus({ status: 401 })).toBe(401);
		expect(resolveApiErrorStatus({ response: { status: 502 } })).toBe(502);
		expect(resolveApiErrorStatus({ data: { status: 422 } })).toBe(422);

		// Нечисловые статусы игнорируются
		expect(resolveApiErrorStatus({ response: { status: "not-a-number" } }, 500)).toBe(500);
		expect(resolveApiErrorStatus({ data: { status: "not-a-number" } }, 500)).toBe(500);
	});

	it("возвращает fallback при отсутствии статуса или некорректном объекте", () => {
		expect(resolveApiErrorStatus(null)).toBe(500);
		expect(resolveApiErrorStatus({}, 400)).toBe(400);
		expect(resolveApiErrorStatus("error string", 400)).toBe(400);
		expect(resolveApiErrorStatus({ data: "string-data" }, 400)).toBe(400);
	});
});
