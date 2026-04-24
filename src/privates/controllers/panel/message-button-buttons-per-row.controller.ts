import type { MessageModalContext } from '@shared/types/message-modal-context.type.js';
import { Injectable, UseGuards } from '@nestjs/common';
import { baseEmbed } from '@shared/constants/base-embed.const.js';
import { ExecutorGuard } from '@shared/guards/executor.guard.js';
import { ExpTimeGuard } from '@shared/guards/exp-time.guard.js';
import { getExpTime } from '@shared/utils/get-exp-time.util.js';
import { getWholeNumber } from '@shared/utils/get-whole-number.util.js';
import { ActionRowBuilder, type ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { Button, type ButtonContext, Context, Modal } from 'necord';
import { privatesPanelReturnButton } from '../../constants/buttons.const.js';
import { PrivatesService } from '../../privates.service.js';

@Injectable()
export class PrivatesMessageButtonButtonsPerRowController {
	public constructor (
		private readonly privatesService: PrivatesService,
	) {}

	@UseGuards(ExpTimeGuard, ExecutorGuard)
	@Button('privatesMessageButtonsPerRow/:expTime/:executorId')
	public async onMessageButtonsPerRowButton (
		@Context() [interaction]: ButtonContext,
	): Promise<void> {
		await interaction.showModal(
			new ModalBuilder()
				.setTitle('Изменить количество кнопок в линии')
				.setCustomId('privatesMessageButtonsPerRowModal')
				.addComponents([
					new ActionRowBuilder<TextInputBuilder>()
						.addComponents([
							new TextInputBuilder()
								.setCustomId('count')
								.setLabel('Новое количество')
								.setPlaceholder('Число от 1 до 5')
								.setStyle(TextInputStyle.Short)
								.setMinLength(1)
								.setMaxLength(1),
						]),
				]),
		);
	}

	@Modal('privatesMessageButtonsPerRowModal')
	public async onModal (
		@Context() [interaction]: MessageModalContext,
	): Promise<void> {
		const count = Math.abs(getWholeNumber(interaction.fields.getTextInputValue('count')));

		if (Number.isNaN(count) || count < 1 || count > 5) {
			await interaction.update({
				embeds: [
					baseEmbed()
						.setTitle('Изменить количество кнопок в линии')
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, **количество кнопок** должно быть **числом** от **1** до **5**`),
				],
				components: [new ActionRowBuilder<ButtonBuilder>().addComponents(privatesPanelReturnButton(interaction.user.id, getExpTime()))],
			});

			return;
		}

		await this.privatesService.updateButtonsPerRow(interaction.guildId!, count);

		await interaction.update({
			embeds: [
				baseEmbed()
					.setTitle('Изменить количество кнопок в линии')
					.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
					.setDescription(`${interaction.user.toString()}, Вы успешно **изменили** количество кнопок в линии`),
			],
			components: [new ActionRowBuilder<ButtonBuilder>().addComponents(privatesPanelReturnButton(interaction.user.id, getExpTime()))],
		});
	}
}
