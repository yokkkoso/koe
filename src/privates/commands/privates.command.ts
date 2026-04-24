import { PrivatesConfig } from '@config/privates.config.js';
import { Injectable, UseGuards } from '@nestjs/common';
import { EmojiRegex } from '@sapphire/discord-utilities';
import { baseEmbed } from '@shared/constants/base-embed.const.js';
import { AdministratorGuard } from '@shared/guards/administrator.guard.js';
import { getExpTime } from '@shared/utils/get-exp-time.util.js';
import {
	ActionRowBuilder,
	type ButtonBuilder,
	inlineCode,
	type MessageActionRowComponentBuilder,
	type StringSelectMenuBuilder,
	TextChannel,
} from 'discord.js';
import { Context, TextCommand, type TextCommandContext } from 'necord';
import { dedent } from 'ts-dedent';
import {
	privatesMessageButtonAdd,
	privatesMessageButtonDelete,
	privatesMessageButtonPosition,
	privatesMessageButtonsPerRow,
	privatesMessagePreview,
	privatesMessageSend,
} from '../constants/buttons.const.js';
import { PrivateButtonStrings } from '../constants/private-button-strings.const.js';
import { PrivatesService } from '../privates.service.js';

@Injectable()
export class PrivatesCommand {
	public constructor (
		private readonly privatesService: PrivatesService,
	) {}

	@UseGuards(AdministratorGuard)
	@TextCommand({
		name: 'privates',
		description: 'Настройка приватных каналов',
	})
	public async onPrivatesCommand (
		@Context() [message]: TextCommandContext,
	): Promise<void> {
		if (!PrivatesConfig.guilds[message.guildId!]) {
			return;
		}

		const config = await this.privatesService.getPrivateConfig(message.guildId!);

		const buttons = config.buttons.toSorted((a, b) => a.position - b.position);

		let buttonsString = '';

		for (const button of buttons) {
			const isCustomEmoji = EmojiRegex.test(button.emoji);

			buttonsString += `**${button.position}**) - ${PrivateButtonStrings[button.type]} [${isCustomEmoji ? button.emoji : inlineCode(button.emoji)}]\n`;
		}

		const expTime = getExpTime();

		const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [
			new ActionRowBuilder<ButtonBuilder>()
				.addComponents(
					privatesMessageButtonAdd(message.author.id, expTime),
					privatesMessageButtonDelete(message.author.id, expTime),
					privatesMessageButtonsPerRow(message.author.id, expTime),
				),
		];

		if (buttons.length > 0) {
			components.push(
				new ActionRowBuilder<StringSelectMenuBuilder>()
					.addComponents(
						privatesMessageButtonPosition(message.author.id, expTime, buttons),
					),
				new ActionRowBuilder<ButtonBuilder>()
					.addComponents(
						privatesMessagePreview(message.author.id, expTime),
						privatesMessageSend(message.author.id, expTime),
					),
			);
		}

		await (message.channel as TextChannel).send({
			embeds: [
				baseEmbed()
					.setTitle('Настройка сообщения для управления приватным каналом')
					.setThumbnail(message.author.displayAvatarURL({ extension: 'png' }))
					.setDescription(
						dedent`
							Количество кнопок в линии: ${config.buttonsPerRow}

							**Кнопки**:${buttons.length > 0 ? `\n\n${buttonsString}` : 'Не добавлены'}
						`,
					),
			],
			components,
		});
	}
}
