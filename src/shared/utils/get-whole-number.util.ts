export function getWholeNumber (value: number | string): number {
	const result
		= typeof value === 'string'
			? Number.parseInt(value, 10)
			: value;

	if (Number.isNaN(result)) {
		return Number.NaN;
	}

	return result;
}
