import { Injectable } from '@nestjs/common';
import { PrivateButtonType } from '@prisma-client';
import { baseEmbed } from '@shared/constants/base-embed.const.js';
import { ActionRowBuilder, GuildMember, OverwriteType, UserSelectMenuBuilder, type VoiceChannel } from 'discord.js';
import {
	Button,
	type ButtonContext,
	Context,
	type ISelectedMembers,
	SelectedMembers,
	UserSelect,
	type UserSelectContext,
} from 'necord';
import { PrivateButtonStrings } from '../../constants/private-button-strings.const.js';
import { PrivatesService } from '../../privates.service.js';

@Injectable()
export class PrivateTransferController {
	public constructor (
		private readonly privatesService: PrivatesService,
	) {}

	@Button(`privateAction/${PrivateButtonType.TRANSFER}`)
	public async onAccessGiveButton (
		@Context() [interaction]: ButtonContext,
	): Promise<void> {
		if (!await this.privatesService.isUserHavePrivateChannel(interaction.guildId!, interaction.user.id)) {
			await interaction.reply({
				embeds: [
					baseEmbed()
						.setTitle(PrivateButtonStrings[PrivateButtonType.TRANSFER])
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, у Вас **нет** своей приватной комнаты`),
				],
				ephemeral: true,
			});

			return;
		}

		await interaction.reply({
			embeds: [
				baseEmbed()
					.setTitle(PrivateButtonStrings[PrivateButtonType.TRANSFER])
					.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
					.setDescription(`${interaction.user.toString()}, **выберите** пользователя, которому Вы хотите **владение** Вашей комнате`),
			],
			components: [
				new ActionRowBuilder<UserSelectMenuBuilder>()
					.addComponents(
						new UserSelectMenuBuilder()
							.setPlaceholder('Выберите пользователя')
							.setCustomId('privateTransferChoose')
							.setMaxValues(1),
					),
			],
			ephemeral: true,
		});
	}

	@UserSelect('privateTransferChoose')
	public async onUserSelect (
		@Context() [interaction]: UserSelectContext,
		@SelectedMembers() members: ISelectedMembers,
	): Promise<void> {
		const privateChannel = await this.privatesService.getPrivateChannelByUser(interaction.guildId!, interaction.user.id);

		if (!privateChannel) {
			await interaction.update({
				embeds: [
					baseEmbed()
						.setTitle(PrivateButtonStrings[PrivateButtonType.TRANSFER])
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, у Вас **нет** своей приватной комнаты`),
				],
				components: [],
			});

			return;
		}

		const voiceChannel = interaction.guild!.channels.cache.get(privateChannel.channelId) as VoiceChannel | undefined;

		if (!voiceChannel) {
			await this.privatesService.deletePrivateChannel(privateChannel.channelId);

			await interaction.update({
				embeds: [
					baseEmbed()
						.setTitle(PrivateButtonStrings[PrivateButtonType.TRANSFER])
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, у Вас **нет** своей приватной комнаты`),
				],
				components: [],
			});

			return;
		}

		const selected = members.first();
		if (!(selected instanceof GuildMember)) {
			return;
		}

		if (!await this.privatesService.isUserHavePrivateChannel(interaction.guildId!, selected.id)) {
			await interaction.reply({
				embeds: [
					baseEmbed()
						.setTitle(PrivateButtonStrings[PrivateButtonType.TRANSFER])
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, ${selected.toString()} уже **является владельцем** другой приватной комнаты`),
				],
				ephemeral: true,
			});

			return;
		}

		if (selected.voice.channelId !== privateChannel.channelId) {
			await interaction.reply({
				embeds: [
					baseEmbed()
						.setTitle(PrivateButtonStrings[PrivateButtonType.TRANSFER])
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, ${selected.toString()} **не находится** в Вашем приватном канале`),
				],
				ephemeral: true,
			});

			return;
		}

		await voiceChannel.permissionOverwrites.delete(interaction.user);

		await voiceChannel.permissionOverwrites.edit(selected.id, {
			Connect: true,
			Speak: true,
			Stream: true,
			ViewChannel: true,
			UseEmbeddedActivities: true,
		}, {
			type: OverwriteType.Member,
		});

		await this.privatesService.updatePrivateChannelOwner(privateChannel.channelId, selected.id);

		await interaction.update({
			embeds: [
				baseEmbed()
					.setTitle(PrivateButtonStrings[PrivateButtonType.TRANSFER])
					.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
					.setDescription(`${interaction.user.toString()}, Вы успешно **передали владение** Вашей приватной комнаты пользователю ${selected.toString()}`),
			],
			components: [],
		});
	}
}
