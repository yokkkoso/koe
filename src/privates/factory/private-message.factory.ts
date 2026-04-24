import { Injectable } from '@nestjs/common';
import { baseEmbed } from '@shared/constants/base-embed.const.js';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	type EmbedBuilder,
	inlineCode,
	type Snowflake,
} from 'discord.js';
import _ from 'lodash';
import { PrivateButtonStrings } from '../constants/private-button-strings.const.js';
import { PrivatesService } from '../privates.service.js';

@Injectable()
export class PrivateMessageFactory {
	public constructor (
		private readonly privatesService: PrivatesService,
	) {}

	public async generateMessage (
		guildId: Snowflake,
		disableButtons = false,
	): Promise<{
		embed: EmbedBuilder;
		components: ActionRowBuilder<ButtonBuilder>[];
	}> {
		const embed = baseEmbed()
			.setTitle('Управление приватной комнатой')
			.setDescription('**Жми следующие кнопки, чтобы настроить свою комнату**\nИспользовать их можно только когда у тебя есть приватный канал');

		const config = await this.privatesService.getPrivateConfig(guildId);

		const configButtons = config.buttons.toSorted((a, b) => a.position - b.position);

		const buttons: ButtonBuilder[] = [];
		const embedFields: string[] = [];

		configButtons.sort((a, b) => a.position - b.position);

		for (const button of configButtons) {
			if (!button) {
				continue;
			}

			buttons.push(
				new ButtonBuilder()
					.setEmoji(button.emoji)
					.setStyle(ButtonStyle.Secondary)
					.setCustomId(`privateAction/${button.type}`)
					.setDisabled(disableButtons),
			);

			embedFields.push(`${button.emoji} — ${inlineCode(PrivateButtonStrings[button.type])}`);
		}

		const actionRows: ActionRowBuilder<ButtonBuilder>[] = [];

		for (const button of _.chunk(buttons, config.buttonsPerRow)) {
			actionRows.push(
				new ActionRowBuilder<ButtonBuilder>()
					.addComponents(button),
			);
		}

		for (const field of _.chunk(embedFields, config.buttonsPerRow)) {
			embed.addFields({
				name: '\u200B',
				value: field.join('\n'),
				inline: true,
			});
		}

		return {
			embed,
			components: actionRows,
		};
	}
}
