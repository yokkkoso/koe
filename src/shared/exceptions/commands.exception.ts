import type { CommandsExceptionDto } from './dto/commands-exception.dto.js';

export class CommandsException extends Error {
	public silent: boolean;

	public constructor ({ name, silent = false }: CommandsExceptionDto) {
		super(name);

		this.silent = silent;
	}
}
