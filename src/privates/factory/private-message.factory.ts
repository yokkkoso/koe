import type { PrivatesMessageDocument } from '../types/privates-message.type.js';
import { Injectable } from '@nestjs/common';
import { baseEmbed } from '@shared/constants/base-embed.const.js';
import {
	ActionRowBuilder,
	type APIMessageTopLevelComponent,
	ButtonBuilder,
	ButtonStyle,
	inlineCode,
	type Snowflake,
} from 'discord.js';
import _ from 'lodash';
import { PrivateButtonStrings } from '../constants/private-button-strings.const.js';
import { PrivatesService } from '../privates.service.js';
import { PRIVATE_ACTION_PREFIX, withDisabledButtons } from '../utils/validate-privates-message.util.js';

@Injectable()
export class PrivateMessageFactory {
	public constructor (
		private readonly privatesService: PrivatesService,
	) {}

	public async generateMessage (
		guildId: Snowflake,
		disableButtons = false,
	): Promise<PrivatesMessageDocument> {
		const config = await this.privatesService.getPrivateConfig(guildId);

		const document = config.message
			? structuredClone(config.message as unknown as PrivatesMessageDocument)
			: this.generateLegacyMessage(config.buttons, config.buttonsPerRow);

		if (disableButtons && document.components) {
			document.components = withDisabledButtons(document.components);
		}

		return document;
	}

	private generateLegacyMessage (
		configButtons: { type: keyof typeof PrivateButtonStrings, emoji: string, position: number }[],
		buttonsPerRow: number,
	): PrivatesMessageDocument {
		const embed = baseEmbed()
			.setTitle('Управление приватной комнатой')
			.setDescription('**Жми следующие кнопки, чтобы настроить свою комнату**\nИспользовать их можно только когда у тебя есть приватный канал');

		const buttons: ButtonBuilder[] = [];
		const embedFields: string[] = [];

		for (const button of configButtons.toSorted((a, b) => a.position - b.position)) {
			buttons.push(
				new ButtonBuilder()
					.setEmoji(button.emoji)
					.setStyle(ButtonStyle.Secondary)
					.setCustomId(`${PRIVATE_ACTION_PREFIX}${button.type}`),
			);

			embedFields.push(`${button.emoji} — ${inlineCode(PrivateButtonStrings[button.type])}`);
		}

		for (const field of _.chunk(embedFields, buttonsPerRow)) {
			embed.addFields({
				name: '\u200B',
				value: field.join('\n'),
				inline: true,
			});
		}

		return {
			embeds: [embed.toJSON()],
			components: _.chunk(buttons, buttonsPerRow).map((row) =>
				new ActionRowBuilder<ButtonBuilder>().addComponents(row).toJSON() as APIMessageTopLevelComponent),
		};
	}
}
