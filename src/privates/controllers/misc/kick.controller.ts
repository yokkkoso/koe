import { Injectable } from '@nestjs/common';
import { PrivateButtonType } from '@prisma-client';
import { baseEmbed } from '@shared/constants/base-embed.const.js';
import { ActionRowBuilder, MentionableSelectMenuBuilder, type VoiceChannel } from 'discord.js';
import {
	Button,
	type ButtonContext,
	Context,
	type ISelectedRoles,
	type ISelectedUsers,
	MentionableSelect,
	type MentionableSelectContext,
	SelectedRoles,
	SelectedUsers,
} from 'necord';
import { PrivateButtonStrings } from '../../constants/private-button-strings.const.js';
import { PrivatesService } from '../../privates.service.js';

@Injectable()
export class PrivateKickController {
	public constructor (
		private readonly privatesService: PrivatesService,
	) {}

	@Button(`privateAction/${PrivateButtonType.KICK}`)
	public async onKickButton (
		@Context() [interaction]: ButtonContext,
	): Promise<void> {
		if (!await this.privatesService.isUserHavePrivateChannel(interaction.guildId!, interaction.user.id)) {
			await interaction.reply({
				embeds: [
					baseEmbed()
						.setTitle(PrivateButtonStrings[PrivateButtonType.KICK])
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
					.setTitle(PrivateButtonStrings[PrivateButtonType.KICK])
					.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
					.setDescription(`${interaction.user.toString()}, **выберите** пользователя или роль, которому(ой) Вы хотите **выгнать** из Вашей комнаты`),
			],
			components: [
				new ActionRowBuilder<MentionableSelectMenuBuilder>()
					.addComponents(
						new MentionableSelectMenuBuilder()
							.setPlaceholder('Выберите пользователя или роль')
							.setCustomId('privateKickChoose')
							.setMaxValues(1),
					),
			],
			ephemeral: true,
		});
	}

	@MentionableSelect('privateKickChoose')
	public async onMentionableSelect (
		@Context() [interaction]: MentionableSelectContext,
		@SelectedUsers() users: ISelectedUsers,
		@SelectedRoles() roles: ISelectedRoles,
	): Promise<void> {
		const privateChannel = await this.privatesService.getPrivateChannelByUser(interaction.guildId!, interaction.user.id);

		if (!privateChannel) {
			await interaction.update({
				embeds: [
					baseEmbed()
						.setTitle(PrivateButtonStrings[PrivateButtonType.KICK])
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
						.setTitle(PrivateButtonStrings[PrivateButtonType.KICK])
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, у Вас **нет** своей приватной комнаты`),
				],
				components: [],
			});

			return;
		}

		const selected = users.first() ?? roles.first();
		if (!selected) {
			return;
		}

		if ('username' in selected && selected.id === interaction.user.id) {
			await interaction.update({
				embeds: [
					baseEmbed()
						.setTitle(PrivateButtonStrings[PrivateButtonType.KICK])
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, Вы **не можете выгнать** из Вашей приватной комнаты **самого себя**`),
				],
				components: [],
			});

			return;
		}

		for (const voiceMember of voiceChannel.members.values()) {
			if (voiceMember.id === interaction.user.id) {
				continue;
			}

			if ('username' in selected) {
				if (voiceMember.id === selected.id) {
					await voiceMember.voice.disconnect().catch(() => {});
				}
			} else if (voiceMember.roles.cache.has(selected.id)) {
				await voiceMember.voice.disconnect().catch(() => {});
			}
		}

		await interaction.update({
			embeds: [
				baseEmbed()
					.setTitle(PrivateButtonStrings[PrivateButtonType.KICK])
					.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
					.setDescription(`${interaction.user.toString()}, Вы успешно **выгнали** ${'name' in selected ? `всех пользователей роли ${selected.toString()}` : `пользователя ${selected.toString()}`} из Вашей приватной комнаты`),
			],
			components: [],
		});
	}
}
