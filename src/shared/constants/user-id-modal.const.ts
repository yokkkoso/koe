import { ActionRowBuilder, ButtonBuilder, ButtonStyle, LabelBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

export const byIdButtonRow = (customId: string): ActionRowBuilder<ButtonBuilder> =>
	new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder().setCustomId(customId).setLabel('Ввести по ID').setStyle(ButtonStyle.Secondary),
	);

export const userIdModal = (customId: string, title: string): ModalBuilder =>
	new ModalBuilder()
		.setCustomId(customId)
		.setTitle(title)
		.addLabelComponents(
			new LabelBuilder()
				.setLabel('ID пользователя')
				.setTextInputComponent(
					new TextInputBuilder()
						.setCustomId('userId')
						.setPlaceholder('Например: 1393883971397484544')
						.setMinLength(15)
						.setMaxLength(20)
						.setStyle(TextInputStyle.Short)
						.setRequired(true),
				),
		);
