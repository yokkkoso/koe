import { Mutex } from 'async-mutex';

export const privatesLocker = new Mutex();
