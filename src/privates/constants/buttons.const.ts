import type { PrivatesButton } from '@prisma-client';
import { ButtonBuilder, ButtonStyle, type Snowflake, StringSelectMenuBuilder } from 'discord.js';
import { PrivateButtonStrings } from './private-button-strings.const.js';

export const privatesMessageButtonAdd = (
	executorId: Snowflake,
	expTime: number | string,
) => new ButtonBuilder()
	.setCustomId(`privatesMessageButtonAdd/${expTime}/${executorId}`)
	.setLabel('Добавить кнопку')
	.setStyle(ButtonStyle.Success);

export const privatesMessageButtonDelete = (
	executorId: Snowflake,
	expTime: number | string,
) => new ButtonBuilder()
	.setCustomId(`privatesMessageButtonDelete/${expTime}/${executorId}`)
	.setLabel('Удалить кнопки')
	.setStyle(ButtonStyle.Danger);

export const privatesMessageButtonsPerRow = (
	executorId: Snowflake,
	expTime: number | string,
) => new ButtonBuilder()
	.setCustomId(`privatesMessageButtonsPerRow/${expTime}/${executorId}`)
	.setLabel('Изменить количество кнопок в линии')
	.setStyle(ButtonStyle.Secondary);

export const privatesMessageButtonPosition = (
	executorId: Snowflake,
	expTime: number | string,
	buttons: PrivatesButton[],
) => new StringSelectMenuBuilder()
	.setCustomId(`privatesMessageButtonPosition/${expTime}/${executorId}`)
	.setPlaceholder('Изменить позицию кнопки')
	.setOptions(
		buttons.map((button) => ({
			label: `${button.position}) ${PrivateButtonStrings[button.type]}`,
			value: button.id.toString(),
		})),
	);

export const privatesMessagePreview = (
	executorId: Snowflake,
	expTime: number | string,
) => new ButtonBuilder()
	.setCustomId(`privatesMessagePreview/${expTime}/${executorId}`)
	.setLabel('Предпросмотр сообщения')
	.setStyle(ButtonStyle.Secondary);

export const privatesMessageSend = (
	executorId: Snowflake,
	expTime: number | string,
) => new ButtonBuilder()
	.setCustomId(`privatesMessageSend/${expTime}/${executorId}`)
	.setLabel('Отправить сообщение')
	.setStyle(ButtonStyle.Primary);

export const privatesPanelReturnButton = (
	executorId: Snowflake,
	expTime: number | string,
) => new ButtonBuilder()
	.setCustomId(`privatesPanelReturn/${expTime}/${executorId}`)
	.setLabel('Вернуться назад')
	.setStyle(ButtonStyle.Secondary);
