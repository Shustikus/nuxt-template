/** Формы слова для русской плюрализации: 1, 2–4, 5+ (с учётом 11–14). */
export interface RussianPluralForms {
	one: string;
	few: string;
	many: string;
}

/** Возвращает число с корректным склонением слова. */
export function formatRussianPluralCount(count: number, forms: RussianPluralForms): string {
	const n = Math.abs(Math.trunc(count));
	const mod10 = n % 10;
	const mod100 = n % 100;

	let word: string;
	if (mod100 >= 11 && mod100 <= 14) {
		word = forms.many;
	} else if (mod10 === 1) {
		word = forms.one;
	} else if (mod10 >= 2 && mod10 <= 4) {
		word = forms.few;
	} else {
		word = forms.many;
	}

	return `${n} ${word}`;
}
