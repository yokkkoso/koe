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
} from 'discord.js';
import { Context, SlashCommand, type SlashCommandContext } from 'necord';
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
	@SlashCommand({
		name: 'privates',
		description: 'Настройка приватных каналов',
		defaultMemberPermissions: 'Administrator',
		dmPermission: false,
	})
	public async onPrivatesCommand (
		@Context() [interaction]: SlashCommandContext,
	): Promise<void> {
		if (!PrivatesConfig.guilds[interaction.guildId!]) {
			return;
		}

		const config = await this.privatesService.getPrivateConfig(interaction.guildId!);

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
					privatesMessageButtonAdd(interaction.user.id, expTime),
					privatesMessageButtonDelete(interaction.user.id, expTime),
					privatesMessageButtonsPerRow(interaction.user.id, expTime),
				),
		];

		if (buttons.length > 0) {
			components.push(
				new ActionRowBuilder<StringSelectMenuBuilder>()
					.addComponents(
						privatesMessageButtonPosition(interaction.user.id, expTime, buttons),
					),
				new ActionRowBuilder<ButtonBuilder>()
					.addComponents(
						privatesMessagePreview(interaction.user.id, expTime),
						privatesMessageSend(interaction.user.id, expTime),
					),
			);
		}

		await interaction.reply({
			embeds: [
				baseEmbed()
					.setTitle('Настройка сообщения для управления приватным каналом')
					.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
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
