import { ButtonBuilder, ButtonStyle, type Snowflake } from 'discord.js';

export const privatesMessageOpen = (url: string) => new ButtonBuilder()
	.setURL(url)
	.setLabel('Открыть в Messēji')
	.setStyle(ButtonStyle.Link);

export const privatesMessageImport = (
	executorId: Snowflake,
	expTime: number | string,
) => new ButtonBuilder()
	.setCustomId(`privatesMessageImport/${expTime}/${executorId}`)
	.setLabel('Импортировать из Messēji')
	.setStyle(ButtonStyle.Success);

export const privatesMessageReset = (
	executorId: Snowflake,
	expTime: number | string,
) => new ButtonBuilder()
	.setCustomId(`privatesMessageReset/${expTime}/${executorId}`)
	.setLabel('Сбросить к стандартному')
	.setStyle(ButtonStyle.Danger);

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

export const privatesMessageMigrate = (
	executorId: Snowflake,
	expTime: number | string,
) => new ButtonBuilder()
	.setCustomId(`privatesMessageMigrate/${expTime}/${executorId}`)
	.setLabel('Перенести старую настройку')
	.setStyle(ButtonStyle.Secondary);
