import { unixTime } from '@shared/utils/unix-time.util.js';

export function getExpTime (timeout = 1800): number {
	return unixTime() + timeout;
}
