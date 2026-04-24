export function pad (number: number): string {
	return number > 9 ? `${number}` : `0${number}`;
}
