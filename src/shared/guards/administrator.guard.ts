import { PrivatesConfig } from '@config/privates.config.js';
import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { CommandsException } from '@shared/exceptions/commands.exception.js';
import { GuildMember } from 'discord.js';
import { NecordExecutionContext } from 'necord';
import { isPrivatesAdmin } from '../utils/is-privates-admin.util.js';

@Injectable()
export class AdministratorGuard implements CanActivate {
	public canActivate (context: ExecutionContext): boolean {
		const necordHost = NecordExecutionContext.create(context);
		const discovery = necordHost.getDiscovery();

		if (!discovery.isSlashCommand()) {
			return true;
		}

		const [command] = necordHost.getContext<'interactionCreate'>();

		if (!(command.member instanceof GuildMember)) {
			throw new CommandsException({
				name: 'команду можно использовать **только на сервере**.',
			});
		}

		const guildConfig = PrivatesConfig.guilds[command.member.guild.id];

		if (!guildConfig) {
			return false;
		}

		if (!isPrivatesAdmin(command.member)) {
			throw new CommandsException({
				name: 'у Вас **недостаточно прав** для выполнения данной команды.',
				silent: true,
			});
		}

		return true;
	}
}
