import { describe, expect, it } from "vitest";
import { formatRussianPluralCount } from "~/shared/utils/formatRussianPluralCount";

describe("formatRussianPluralCount", () => {
	const forms = { one: "товар", few: "товара", many: "товаров" };

	it("склоняет 1, 21, 101 как one", () => {
		expect(formatRussianPluralCount(1, forms)).toBe("1 товар");
		expect(formatRussianPluralCount(21, forms)).toBe("21 товар");
		expect(formatRussianPluralCount(101, forms)).toBe("101 товар");
	});

	it("склоняет 2, 3, 4, 22 как few", () => {
		expect(formatRussianPluralCount(2, forms)).toBe("2 товара");
		expect(formatRussianPluralCount(3, forms)).toBe("3 товара");
		expect(formatRussianPluralCount(4, forms)).toBe("4 товара");
		expect(formatRussianPluralCount(24, forms)).toBe("24 товара");
	});

	it("склоняет 5, 10, 11-14, 20 как many", () => {
		expect(formatRussianPluralCount(0, forms)).toBe("0 товаров");
		expect(formatRussianPluralCount(5, forms)).toBe("5 товаров");
		expect(formatRussianPluralCount(11, forms)).toBe("11 товаров");
		expect(formatRussianPluralCount(12, forms)).toBe("12 товаров");
		expect(formatRussianPluralCount(14, forms)).toBe("14 товаров");
		expect(formatRussianPluralCount(25, forms)).toBe("25 товаров");
	});
});
