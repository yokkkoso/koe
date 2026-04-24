import { Injectable, UseGuards } from '@nestjs/common';
import { baseEmbed } from '@shared/constants/base-embed.const.js';
import { ExecutorGuard } from '@shared/guards/executor.guard.js';
import { ExpTimeGuard } from '@shared/guards/exp-time.guard.js';
import { getWholeNumber } from '@shared/utils/get-whole-number.util.js';
import { ActionRowBuilder, type ButtonBuilder, StringSelectMenuBuilder } from 'discord.js';
import {
	Button,
	type ButtonContext,
	type ChannelSelectContext,
	ComponentParam,
	Context,
	SelectedStrings,
	StringSelect,
} from 'necord';
import { privatesPanelReturnButton } from '../../constants/buttons.const.js';
import { PrivateButtonStrings } from '../../constants/private-button-strings.const.js';
import { PrivatesService } from '../../privates.service.js';

@Injectable()
export class PrivatesMessageButtonDeleteController {
	public constructor (
		private readonly privatesService: PrivatesService,
	) {}

	@UseGuards(ExpTimeGuard, ExecutorGuard)
	@Button('privatesMessageButtonDelete/:expTime/:executorId')
	public async onMessageButtonDeleteButton (
		@Context() [interaction]: ButtonContext,
		@ComponentParam('expTime') expTime: string,
	): Promise<void> {
		const config = await this.privatesService.getPrivateConfig(interaction.guildId!);

		if (config.buttons.length <= 0) {
			await interaction.update({
				embeds: [
					baseEmbed()
						.setTitle('Удалить кнопки')
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, нет **ни одной** кнопки **доступной** для удаления`),
				],
				components: [new ActionRowBuilder<ButtonBuilder>().addComponents(privatesPanelReturnButton(interaction.user.id, expTime))],
			});

			return;
		}

		const buttons = config.buttons.toSorted((a, b) => a.position - b.position);

		const selectMenu = new StringSelectMenuBuilder()
			.setPlaceholder('Выберите кнопки для удаления')
			.setCustomId(`privatesMessageButtonsDeleteChoose/${expTime}/${interaction.user.id}`)
			.setMinValues(1);

		for (const button of buttons) {
			selectMenu.addOptions({
				label: PrivateButtonStrings[button.type],
				value: button.id.toString(),
			});
		}

		await interaction.update({
			embeds: [
				baseEmbed()
					.setTitle('Удалить кнопки')
					.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' })),
			],
			components: [
				new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu),
				new ActionRowBuilder<ButtonBuilder>().addComponents(privatesPanelReturnButton(interaction.user.id, expTime)),
			],
		});
	}

	@UseGuards(ExpTimeGuard, ExecutorGuard)
	@StringSelect('privatesMessageButtonsDeleteChoose/:expTime/:executorId')
	public async onStringSelect (
		@Context() [interaction]: ChannelSelectContext,
		@ComponentParam('expTime') expTime: string,
		@SelectedStrings() buttons: string[],
	): Promise<void> {
		for (const button of buttons) {
			await this.privatesService.deleteButton(getWholeNumber(button));
		}

		await interaction.update({
			embeds: [
				baseEmbed()
					.setTitle('Удалить кнопки')
					.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
					.setDescription(`${interaction.user.toString()}, Вы **удалили** кнопки`),
			],
			components: [new ActionRowBuilder<ButtonBuilder>().addComponents(privatesPanelReturnButton(interaction.user.id, expTime))],
		});
	}
}
