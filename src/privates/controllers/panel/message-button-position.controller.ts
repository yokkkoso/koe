import { Injectable, ParseIntPipe, UseGuards } from '@nestjs/common';
import { baseEmbed } from '@shared/constants/base-embed.const.js';
import { ExecutorGuard } from '@shared/guards/executor.guard.js';
import { ExpTimeGuard } from '@shared/guards/exp-time.guard.js';
import { getWholeNumber } from '@shared/utils/get-whole-number.util.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import _ from 'lodash';
import {
	Button,
	type ButtonContext,
	ComponentParam,
	Context,
	SelectedStrings,
	StringSelect,
	type StringSelectContext,
} from 'necord';
import { privatesPanelReturnButton } from '../../constants/buttons.const.js';
import { PrivatesService } from '../../privates.service.js';

@Injectable()
export class PrivatesMessageButtonPositionController {
	public constructor (
		private readonly privatesService: PrivatesService,
	) {}

	@UseGuards(ExpTimeGuard, ExecutorGuard)
	@StringSelect('privatesMessageButtonPosition/:expTime/:executorId')
	public async onMessageButtonPositionSelect (
		@Context() [interaction]: StringSelectContext,
		@ComponentParam('expTime') expTime: string,
		@SelectedStrings() [selected]: [string],
	): Promise<void> {
		const selectedButtonId = getWholeNumber(selected);

		const config = await this.privatesService.getPrivateConfig(interaction.guildId!);

		const configButtons = config.buttons.toSorted((a, b) => a.position - b.position);

		const buttons: ButtonBuilder[] = [];

		for (const button of configButtons) {
			buttons.push(
				new ButtonBuilder()
					.setEmoji(button.emoji)
					.setStyle(ButtonStyle.Secondary)
					.setCustomId(`privatesMessageButtonPositionChoose/${expTime}/${interaction.user.id}/${selectedButtonId}/${button.id}`)
					.setDisabled(selectedButtonId === button.id),
			);
		}

		const actionRows: ActionRowBuilder<ButtonBuilder>[] = [];

		for (const button of _.chunk(buttons, config.buttonsPerRow)) {
			actionRows.push(
				new ActionRowBuilder<ButtonBuilder>()
					.addComponents(button),
			);
		}

		await interaction.update({
			embeds: [
				baseEmbed()
					.setTitle('Изменить позицию кнопки')
					.setDescription(`${interaction.user.toString()}, выберите кнопку с которой хотите поменять местами выбранную кнопку`)
					.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' })),
			],
			components: [
				...actionRows,
				new ActionRowBuilder<ButtonBuilder>().addComponents(privatesPanelReturnButton(interaction.user.id, expTime)),
			],
		});
	}

	@UseGuards(ExpTimeGuard, ExecutorGuard)
	@Button('privatesMessageButtonPositionChoose/:expTime/:executorId/:firstButtonId/:secondButtonId')
	public async onButton (
		@Context() [interaction]: ButtonContext,
		@ComponentParam('expTime') expTime: string,
		@ComponentParam('firstButtonId', ParseIntPipe) firstButtonId: number,
		@ComponentParam('secondButtonId', ParseIntPipe) secondButtonId: number,
	): Promise<void> {
		await this.privatesService.swapButtonsPosition(firstButtonId, secondButtonId);

		await interaction.update({
			embeds: [
				baseEmbed()
					.setTitle('Изменить позицию кнопки')
					.setDescription(`${interaction.user.toString()}, Вы успешно **изменили** позицию кнопки`)
					.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' })),
			],
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(privatesPanelReturnButton(interaction.user.id, expTime)),
			],
		});
	}
}
