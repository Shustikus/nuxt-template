import { describe, expect, it } from "vitest";
import { ref } from "vue";
import {
	resolveSvgIconBoxStyle,
	resolveSvgIconSizeStyle,
	useSvgIconBox,
	useSvgIconSize,
} from "~/shared/utils/svgIconSize";

describe("resolveSvgIconSizeStyle", () => {
	it("конвертирует число в px", () => {
		expect(resolveSvgIconSizeStyle(24)).toEqual({ width: "24px", height: "24px" });
	});

	it("конвертирует строковое число без единиц в px", () => {
		expect(resolveSvgIconSizeStyle("24")).toEqual({ width: "24px", height: "24px" });
	});

	it("сохраняет строковое значение с единицами", () => {
		expect(resolveSvgIconSizeStyle("2rem")).toEqual({ width: "2rem", height: "2rem" });
	});
});

describe("resolveSvgIconBoxStyle", () => {
	it("нормализует ширину и высоту по отдельности", () => {
		expect(resolveSvgIconBoxStyle(24, "100%")).toEqual({ width: "24px", height: "100%" });
		expect(resolveSvgIconBoxStyle("50%", 32)).toEqual({ width: "50%", height: "32px" });
	});
});

describe("useSvgIconSize", () => {
	it("реагирует на смену размера", () => {
		const size = ref(18);
		const style = useSvgIconSize(size);

		expect(style.value).toEqual({ width: "18px", height: "18px" });

		size.value = 26;
		expect(style.value).toEqual({ width: "26px", height: "26px" });
	});
});

describe("useSvgIconBox", () => {
	it("реагирует на смену ширины и высоты", () => {
		const width = ref(24);
		const height = ref<number | string>(24);
		const style = useSvgIconBox(width, height);

		expect(style.value).toEqual({ width: "24px", height: "24px" });

		height.value = "1em";
		expect(style.value).toEqual({ width: "24px", height: "1em" });
	});
});
