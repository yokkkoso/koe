import type { CommandsExceptionDto } from './dto/commands-exception.dto.js';

export class CommandsException extends Error {
	public silent: boolean;

	public deleteCommand: boolean;

	public constructor ({ name, deleteCommand = false, silent = false }: CommandsExceptionDto) {
		super(name);

		this.deleteCommand = deleteCommand;
		this.silent = silent;
	}
}
