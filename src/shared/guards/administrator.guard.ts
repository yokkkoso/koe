import { MainConfig } from '@config/main.config.js';
import { PrivatesConfig } from '@config/privates.config.js';
import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { CommandsException } from '@shared/exceptions/commands.exception.js';
import { GuildMember } from 'discord.js';
import { NecordExecutionContext } from 'necord';
import { isMemberHaveRole } from '../utils/is-member-have-role.util.js';

@Injectable()
export class AdministratorGuard implements CanActivate {
	public canActivate (context: ExecutionContext): boolean {
		const necordHost = NecordExecutionContext.create(context);
		const discovery = necordHost.getDiscovery();

		if (!discovery.isTextCommand() && !discovery.isSlashCommand()) {
			return true;
		}

		const [command] = discovery.isSlashCommand()
			? necordHost.getContext<'interactionCreate'>()
			: necordHost.getContext<'messageCreate'>();

		if (!(command.member instanceof GuildMember)) {
			throw new CommandsException({
				name: 'команду можно использовать **только на сервере**.',
			});
		}

		const guildConfig = PrivatesConfig.guilds[command.member.guild.id];

		if (!guildConfig) {
			return false;
		}

		if (
			!MainConfig.adminUserIds.includes(command.member.id)
			&& !guildConfig.adminUserIds.includes(command.member.id)
			&& !isMemberHaveRole(command.member, guildConfig.adminRoleIds)
		) {
			throw new CommandsException({
				name: 'у Вас **недостаточно прав** для выполнения данной команды.',
				silent: true,
			});
		}

		return true;
	}
}
