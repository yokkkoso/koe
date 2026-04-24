import { Injectable } from '@nestjs/common';
import { PrivateButtonType } from '@prisma-client';
import { baseEmbed } from '@shared/constants/base-embed.const.js';
import { getWholeNumber } from '@shared/utils/get-whole-number.util.js';
import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, type VoiceChannel } from 'discord.js';
import { Button, type ButtonContext, Context, Modal, type ModalContext } from 'necord';
import { PrivateButtonStrings } from '../../constants/private-button-strings.const.js';
import { PrivatesService } from '../../privates.service.js';

@Injectable()
export class PrivateUserLimitController {
	public constructor (
		private readonly privatesService: PrivatesService,
	) {}

	@Button(`privateAction/${PrivateButtonType.USER_LIMIT}`)
	public async onUserLimitButton (
		@Context() [interaction]: ButtonContext,
	): Promise<void> {
		const privateChannel = await this.privatesService.getPrivateChannelByUser(interaction.guildId!, interaction.user.id);

		if (!privateChannel) {
			await interaction.reply({
				embeds: [
					baseEmbed()
						.setTitle(PrivateButtonStrings[PrivateButtonType.USER_LIMIT])
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, у Вас **нет** своей приватной комнаты`),
				],
				ephemeral: true,
			});

			return;
		}

		await interaction.showModal(
			new ModalBuilder()
				.setTitle(PrivateButtonStrings[PrivateButtonType.USER_LIMIT])
				.setCustomId('privateUserLimitModal')
				.addComponents([
					new ActionRowBuilder<TextInputBuilder>()
						.addComponents([
							new TextInputBuilder()
								.setCustomId('userLimit')
								.setLabel('Новый лимит пользователей')
								.setPlaceholder('Число от 0 до 99')
								.setStyle(TextInputStyle.Short)
								.setMinLength(1)
								.setMaxLength(2),
						]),
				]),
		);
	}

	@Modal('privateUserLimitModal')
	public async onModal (
		@Context() [interaction]: ModalContext,
	): Promise<void> {
		const privateChannel = await this.privatesService.getPrivateChannelByUser(interaction.guildId!, interaction.user.id);

		if (!privateChannel) {
			await interaction.reply({
				embeds: [
					baseEmbed()
						.setTitle(PrivateButtonStrings[PrivateButtonType.USER_LIMIT])
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
						.setTitle(PrivateButtonStrings[PrivateButtonType.USER_LIMIT])
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, у Вас **нет** своей приватной комнаты`),
				],
				ephemeral: true,
			});

			return;
		}

		const userLimit = interaction.fields.getTextInputValue('userLimit')
			? Math.abs(getWholeNumber(interaction.fields.getTextInputValue('userLimit')))
			: 0;

		if (Number.isNaN(userLimit) || userLimit < 0 || userLimit > 99) {
			await interaction.reply({
				embeds: [
					baseEmbed()
						.setTitle(PrivateButtonStrings[PrivateButtonType.USER_LIMIT])
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, **лимит пользователей** должен быть **числом** от **0** до **99**`),
				],
				ephemeral: true,
			});

			return;
		}

		await voiceChannel.setUserLimit(userLimit);

		await interaction.reply({
			embeds: [
				baseEmbed()
					.setTitle(PrivateButtonStrings[PrivateButtonType.USER_LIMIT])
					.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
					.setDescription(`${interaction.user.toString()}, Вы успешно **изменили** лимит пользователей Вашей приватной комнаты`),
			],
			ephemeral: true,
		});
	}
}
