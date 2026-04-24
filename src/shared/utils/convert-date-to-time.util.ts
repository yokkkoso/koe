import { pad } from './pad.util.js';

export function convertDateToTime<T extends boolean = false> (date: Date, usePad?: T):
{
	days: T extends true ? string : number;
	hours: T extends true ? string : number;
	min: T extends true ? string : number;
	sec: T extends true ? string : number;
} {
	const timeEnd = date.getTime();

	let today = Date.now();
	today = Math.abs(Math.floor((timeEnd - today) / 1000));

	const sec = today % 60;
	today = Math.floor(today / 60);

	const min = today % 60;
	today = Math.floor(today / 60);

	const hours = today % 24;
	today = Math.floor(today / 24);

	const days = today;

	return {
		days: usePad ? pad(days) : days,
		hours: usePad ? pad(hours) : hours,
		min: usePad ? pad(min) : min,
		sec: usePad ? pad(sec) : sec,
	} as {
		days: T extends true ? string : number;
		hours: T extends true ? string : number;
		min: T extends true ? string : number;
		sec: T extends true ? string : number;
	};
}
