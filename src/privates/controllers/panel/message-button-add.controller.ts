import type { MessageModalContext } from '@shared/types/message-modal-context.type.js';
import { Injectable, UseGuards } from '@nestjs/common';
import { PrivateButtonType } from '@prisma-client';
import { baseEmbed } from '@shared/constants/base-embed.const.js';
import { ExecutorGuard } from '@shared/guards/executor.guard.js';
import { ExpTimeGuard } from '@shared/guards/exp-time.guard.js';
import { getWholeNumber } from '@shared/utils/get-whole-number.util.js';
import {
	ActionRowBuilder,
	type ButtonBuilder,
	inlineCode,
	ModalBuilder,
	StringSelectMenuBuilder,
	TextInputBuilder,
	TextInputStyle,
} from 'discord.js';
import {
	Button,
	type ButtonContext,
	type ChannelSelectContext,
	ComponentParam,
	Context,
	Modal,
	ModalParam,
	SelectedStrings,
	StringSelect,
} from 'necord';
import { $enum } from 'ts-enum-util';
import { privatesPanelReturnButton } from '../../constants/buttons.const.js';
import { PrivateButtonStrings } from '../../constants/private-button-strings.const.js';
import { PrivatesService } from '../../privates.service.js';

@Injectable()
export class PrivatesMessageButtonAddController {
	public constructor (
		private readonly privatesService: PrivatesService,
	) {}

	@UseGuards(ExpTimeGuard, ExecutorGuard)
	@Button('privatesMessageButtonAdd/:expTime/:executorId')
	public async onMessageButtonAddButton (
		@Context() [interaction]: ButtonContext,
		@ComponentParam('expTime') expTime: string,
	): Promise<void> {
		const selectMenu = new StringSelectMenuBuilder()
			.setPlaceholder('Выберите действие для кнопки')
			.setCustomId(`privatesMessageAddChoose/${expTime}/${interaction.user.id}`)
			.setMaxValues(1);

		const config = await this.privatesService.getPrivateConfig(interaction.guildId!);

		if (config.buttons.length >= config.buttonsPerRow * 3) {
			await interaction.update({
				embeds: [
					baseEmbed()
						.setTitle('Добавить кнопку')
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, достигнут лимит кнопок`),
				],
				components: [new ActionRowBuilder<ButtonBuilder>().addComponents(privatesPanelReturnButton(interaction.user.id, expTime))],
			});

			return;
		}

		const availableButtons = $enum(PrivateButtonType)
			.getValues()
			.filter((type) => !config.buttons.some((currentButton) => currentButton.type === type));

		for (const availableButton of availableButtons) {
			selectMenu.addOptions({
				label: PrivateButtonStrings[availableButton],
				value: availableButton,
			});
		}

		await interaction.update({
			embeds: [
				baseEmbed()
					.setTitle('Добавить кнопку')
					.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' })),
			],
			components: [
				new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu),
				new ActionRowBuilder<ButtonBuilder>().addComponents(privatesPanelReturnButton(interaction.user.id, expTime)),
			],
		});
	}

	@UseGuards(ExpTimeGuard, ExecutorGuard)
	@StringSelect('privatesMessageAddChoose/:expTime/:executorId')
	public async onStringSelect (
		@Context() [interaction]: ChannelSelectContext,
		@ComponentParam('expTime') expTime: string,
		@SelectedStrings() [buttonType]: [PrivateButtonType],
	): Promise<void> {
		const config = await this.privatesService.getPrivateConfig(interaction.guildId!);

		await interaction.showModal(
			new ModalBuilder()
				.setCustomId(`privateMessageAddModal/${expTime}/${interaction.user.id}/${buttonType}`)
				.setTitle('Добавить кнопку')
				.addComponents([
					new ActionRowBuilder<TextInputBuilder>()
						.addComponents([
							new TextInputBuilder()
								.setLabel('Эмодзи')
								.setCustomId('emoji')
								.setPlaceholder('Например, <:abc:123> или 🌪️')
								.setMinLength(1)
								.setStyle(TextInputStyle.Short)
								.setRequired(),
						]),
					new ActionRowBuilder<TextInputBuilder>()
						.addComponents([
							new TextInputBuilder()
								.setLabel('Позиция')
								.setCustomId('position')
								.setPlaceholder(`Число от 1 до ${config.buttonsPerRow * 3}`)
								.setMinLength(1)
								.setMaxLength(2)
								.setStyle(TextInputStyle.Short)
								.setRequired(),
						]),
				]),
		);
	}

	@UseGuards(ExpTimeGuard, ExecutorGuard)
	@Modal('privateMessageAddModal/:expTime/:executorId/:buttonType')
	public async onModal (
		@Context() [interaction]: MessageModalContext,
		@ModalParam('expTime') expTime: string,
		@ModalParam('buttonType') buttonType: PrivateButtonType,
	): Promise<void> {
		const config = await this.privatesService.getPrivateConfig(interaction.guildId!);

		const emoji = interaction.fields.getTextInputValue('emoji');
		const position = getWholeNumber(interaction.fields.getTextInputValue('position'));

		if (Number.isNaN(position) || position < 1 || position > config.buttonsPerRow * 3) {
			await interaction.update({
				embeds: [
					baseEmbed()
						.setTitle('Добавить кнопку')
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, **позиция** должна быть **числом**, которое **больше** или **равно** **1** и **меньше** или **равно** **${config.buttonsPerRow * 3}**`),
				],
				components: [new ActionRowBuilder<ButtonBuilder>().addComponents(privatesPanelReturnButton(interaction.user.id, expTime))],
			});

			return;
		}

		if (await this.privatesService.isTypeAlreadyUsing(interaction.guildId!, buttonType)) {
			await interaction.update({
				embeds: [
					baseEmbed()
						.setTitle('Добавить кнопку')
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, действие ${inlineCode(PrivateButtonStrings[buttonType])} **уже** используется другой кнопкой`),
				],
				components: [new ActionRowBuilder<ButtonBuilder>().addComponents(privatesPanelReturnButton(interaction.user.id, expTime))],
			});

			return;
		}

		if (await this.privatesService.isPositionAlreadyUsing(interaction.guildId!, position)) {
			await interaction.update({
				embeds: [
					baseEmbed()
						.setTitle('Добавить кнопку')
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, позиция ${inlineCode(position.toString())} **уже** используется другой кнопкой`),
				],
				components: [new ActionRowBuilder<ButtonBuilder>().addComponents(privatesPanelReturnButton(interaction.user.id, expTime))],
			});

			return;
		}

		await this.privatesService.createButton(
			interaction.guildId!,
			buttonType,
			emoji,
			position,
		);

		await interaction.update({
			embeds: [
				baseEmbed()
					.setTitle('Добавить кнопку')
					.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
					.setDescription(`${interaction.user.toString()}, Вы **добавили** кнопку в сообщения для управления приватной комнатой`),
			],
			components: [new ActionRowBuilder<ButtonBuilder>().addComponents(privatesPanelReturnButton(interaction.user.id, expTime))],
		});
	}
}
