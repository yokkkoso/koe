import { Injectable, UseGuards } from '@nestjs/common';
import { baseEmbed } from '@shared/constants/base-embed.const.js';
import { ExecutorGuard } from '@shared/guards/executor.guard.js';
import { ExpTimeGuard } from '@shared/guards/exp-time.guard.js';
import { ActionRowBuilder, type ButtonBuilder } from 'discord.js';
import { Button, type ButtonContext, ComponentParam, Context } from 'necord';
import { privatesPanelReturnButton } from '../../constants/buttons.const.js';
import { PrivatesService } from '../../privates.service.js';

@Injectable()
export class PrivatesMessageResetController {
	public constructor (
		private readonly privatesService: PrivatesService,
	) {}

	@UseGuards(ExpTimeGuard, ExecutorGuard)
	@Button('privatesMessageReset/:expTime/:executorId')
	public async onMessageResetButton (
		@Context() [interaction]: ButtonContext,
		@ComponentParam('expTime') expTime: string,
	): Promise<void> {
		await this.privatesService.updateMessage(interaction.guildId!, null);

		await interaction.update({
			embeds: [
				baseEmbed()
					.setTitle('Сбросить к стандартному')
					.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
					.setDescription(`${interaction.user.toString()}, сообщение из Messēji **удалено** - снова используется стандартное`),
			],
			components: [new ActionRowBuilder<ButtonBuilder>().addComponents(privatesPanelReturnButton(interaction.user.id, expTime))],
		});
	}
}
