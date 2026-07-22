import { type ArgumentsHost, Catch, type ExceptionFilter } from '@nestjs/common';
import { InteractionType } from 'discord.js';
import { NecordArgumentsHost } from 'necord';
import { baseEmbed } from '../constants/base-embed.const.js';
import { CommandsException } from '../exceptions/commands.exception.js';

@Catch(CommandsException)
export class NecordExceptionFilter implements ExceptionFilter {
	public async catch (exception: CommandsException, host: ArgumentsHost): Promise<void> {
		if (exception.silent) {
			return;
		}

		const necordHost = NecordArgumentsHost.create(host);
		const discovery = necordHost.getDiscovery();

		if (discovery.isSlashCommand()) {
			const [interaction] = necordHost.getContext<'interactionCreate'>();
			const description = discovery.getDescription();

			if (interaction.type === InteractionType.ApplicationCommand) {
				await interaction.reply({
					embeds: [
						baseEmbed()
							.setTitle(description)
							.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
							.setDescription(`${interaction.user.toString()}, ${exception.message}`),
					],
					ephemeral: true,
				});
			}
		}
	}
}
