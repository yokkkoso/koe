import { Injectable } from '@nestjs/common';
import { PrivateButtonType } from '@prisma-client';
import { baseEmbed } from '@shared/constants/base-embed.const.js';
import { convertDateToTime } from '@shared/utils/convert-date-to-time.util.js';
import {
	ActionRowBuilder,
	DiscordAPIError,
	inlineCode,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	type VoiceChannel,
} from 'discord.js';
import { Button, type ButtonContext, Context, Modal, type ModalContext } from 'necord';
import { PrivateButtonStrings } from '../../constants/private-button-strings.const.js';
import { PrivatesService } from '../../privates.service.js';

@Injectable()
export class PrivateRenameController {
	public constructor (
		private readonly privatesService: PrivatesService,
	) {}

	@Button(`privateAction/${PrivateButtonType.RENAME}`)
	public async onRenameButton (
		@Context() [interaction]: ButtonContext,
	): Promise<void> {
		const privateChannel = await this.privatesService.getPrivateChannelByUser(interaction.guildId!, interaction.user.id);

		if (!privateChannel) {
			await interaction.reply({
				embeds: [
					baseEmbed()
						.setTitle(PrivateButtonStrings[PrivateButtonType.RENAME])
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, у Вас **нет** своей приватной комнаты`),
				],
				ephemeral: true,
			});

			return;
		}

		if (privateChannel.renameAt && new Date() < privateChannel.renameAt) {
			const cooldownTime = convertDateToTime(privateChannel.renameAt);
			let cooldownString = '';

			if (cooldownTime.hours > 0) {
				cooldownString += `**${cooldownTime.hours}** ч. `;
			}

			if (cooldownTime.min > 0 && cooldownTime.min <= 60) {
				cooldownString += `**${cooldownTime.min}** мин. `;
			}

			if (cooldownTime.sec > 0 && cooldownTime.sec <= 60) {
				cooldownString += `**${cooldownTime.sec}** сек.`;
			}

			await interaction.reply({
				embeds: [
					baseEmbed()
						.setTitle(PrivateButtonStrings[PrivateButtonType.RENAME])
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, Вы недавно **уже изменяли** название Вашей приватной комнаты! Вы сможете **изменить повторно** через ${cooldownString}`),
				],
				ephemeral: true,
			});

			return;
		}

		await interaction.showModal(
			new ModalBuilder()
				.setTitle(PrivateButtonStrings[PrivateButtonType.RENAME])
				.setCustomId('privateRenameModal')
				.addComponents([
					new ActionRowBuilder<TextInputBuilder>()
						.addComponents([
							new TextInputBuilder()
								.setCustomId('name')
								.setLabel('Новое название')
								.setStyle(TextInputStyle.Short)
								.setMinLength(1)
								.setMaxLength(100)
								.setRequired(),
						]),
				]),
		);
	}

	@Modal('privateRenameModal')
	public async onModal (
		@Context() [interaction]: ModalContext,
	): Promise<void> {
		const privateChannel = await this.privatesService.getPrivateChannelByUser(interaction.guildId!, interaction.user.id);

		if (!privateChannel) {
			await interaction.reply({
				embeds: [
					baseEmbed()
						.setTitle(PrivateButtonStrings[PrivateButtonType.RENAME])
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, у Вас **нет** своей приватной комнаты`),
				],
				ephemeral: true,
			});

			return;
		}

		const voiceChannel = interaction.guild!.channels.cache.get(privateChannel.channelId) as VoiceChannel | undefined;

		if (!voiceChannel) {
			await this.privatesService.deletePrivateChannel(privateChannel.channelId);

			await interaction.reply({
				embeds: [
					baseEmbed()
						.setTitle(PrivateButtonStrings[PrivateButtonType.RENAME])
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, у Вас **нет** своей приватной комнаты`),
				],
				ephemeral: true,
			});

			return;
		}

		const name = interaction.fields.getTextInputValue('name');

		try {
			await voiceChannel.setName(name);

			await this.privatesService.updatePrivateChannelRenameCooldown(privateChannel.channelId);

			await interaction.reply({
				embeds: [
					baseEmbed()
						.setTitle(PrivateButtonStrings[PrivateButtonType.RENAME])
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, Вы успешно **изменили** название Вашей приватной комнаты`),
				],
				ephemeral: true,
			});
		} catch (error) {
			if (
				error instanceof DiscordAPIError
				&& (error.toString().includes('Server Discovery') || error.toString().includes('Channel name cannot be'))
			) {
				await interaction.reply({
					embeds: [
						baseEmbed()
							.setTitle(PrivateButtonStrings[PrivateButtonType.RENAME])
							.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
							.setDescription(`${interaction.user.toString()}, ${inlineCode(name)} **нельзя использовать** в качестве названия для приватной комнаты`),
					],
					ephemeral: true,
				});
			}
		}
	}
}
