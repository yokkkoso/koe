import { Injectable, UseGuards } from '@nestjs/common';
import { baseEmbed } from '@shared/constants/base-embed.const.js';
import { ExecutorGuard } from '@shared/guards/executor.guard.js';
import { ExpTimeGuard } from '@shared/guards/exp-time.guard.js';
import { ActionRowBuilder, type ButtonBuilder } from 'discord.js';
import { Button, type ButtonContext, ComponentParam, Context } from 'necord';
import { privatesPanelReturnButton } from '../../constants/buttons.const.js';
import { PrivateMessageFactory } from '../../factory/private-message.factory.js';
import { PrivatesService } from '../../privates.service.js';

@Injectable()
export class PrivatesMessageMigrateController {
	public constructor (
		private readonly privatesService: PrivatesService,
		private readonly privateMessageFactory: PrivateMessageFactory,
	) {}

	@UseGuards(ExpTimeGuard, ExecutorGuard)
	@Button('privatesMessageMigrate/:expTime/:executorId')
	public async onMessageMigrateButton (
		@Context() [interaction]: ButtonContext,
		@ComponentParam('expTime') expTime: string,
	): Promise<void> {
		const config = await this.privatesService.getPrivateConfig(interaction.guildId!);

		if (config.message || config.buttons.length === 0) {
			await interaction.update({
				embeds: [
					baseEmbed()
						.setTitle('Перенести старую настройку')
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, переносить нечего: ${config.message ? 'сообщение уже собрано в Messēji' : 'старых кнопок нет'}`),
				],
				components: [new ActionRowBuilder<ButtonBuilder>().addComponents(privatesPanelReturnButton(interaction.user.id, expTime))],
			});

			return;
		}

		await this.privatesService.updateMessage(interaction.guildId!, await this.privateMessageFactory.generateMessage(interaction.guildId!));

		await interaction.update({
			embeds: [
				baseEmbed()
					.setTitle('Перенести старую настройку')
					.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
					.setDescription(`${interaction.user.toString()}, старые кнопки (${config.buttons.length}) **перенесены** в новый формат. Теперь сообщение можно править в Messēji через «Открыть в Messēji»`),
			],
			components: [new ActionRowBuilder<ButtonBuilder>().addComponents(privatesPanelReturnButton(interaction.user.id, expTime))],
		});
	}
}
