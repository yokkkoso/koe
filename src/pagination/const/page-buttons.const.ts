import { EmojiConfig } from '@config/emoji.config.js';
import { ButtonBuilder, ButtonStyle, type Snowflake } from 'discord.js';
import { PageAction } from '../enums/page-action.enum.js';

export const pageButtons = (
	customId: string,
	currentPage: number,
	totalPages: number,
	expTime: number | string,
	executorId: Snowflake,
) => [
	new ButtonBuilder()
		.setCustomId(`${customId}/${expTime}/${executorId}/${PageAction.Prev}/${currentPage}/${totalPages}`)
		.setStyle(ButtonStyle.Secondary)
		.setEmoji(EmojiConfig.pages.previous),
	new ButtonBuilder()
		.setCustomId(`${customId}/${expTime}/${executorId}/${PageAction.Next}/${currentPage}/${totalPages}`)
		.setStyle(ButtonStyle.Secondary)
		.setEmoji(EmojiConfig.pages.next),
];

export const pageButtonsExtended = (
	customId: string,
	currentPage: number,
	totalPages: number,
	expTime: number | string,
	executorId: Snowflake,
) => [
	new ButtonBuilder()
		.setCustomId(`${customId}/${expTime}/${executorId}/${PageAction.First}/${currentPage}/${totalPages}`)
		.setStyle(ButtonStyle.Secondary)
		.setEmoji(EmojiConfig.pages.first),
	...pageButtons(customId, currentPage, totalPages, expTime, executorId),
	new ButtonBuilder()
		.setCustomId(`${customId}/${expTime}/${executorId}/${PageAction.Last}/${currentPage}/${totalPages}`)
		.setStyle(ButtonStyle.Secondary)
		.setEmoji(EmojiConfig.pages.last),
];
