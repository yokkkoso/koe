import { Injectable } from '@nestjs/common';
import { PrivateButtonType } from '@prisma-client';
import { baseEmbed } from '@shared/constants/base-embed.const.js';
import { byIdButtonRow, userIdModal } from '@shared/constants/user-id-modal.const.js';
import { fetchMemberById } from '@shared/utils/fetch-member-by-id.util.js';
import {
	ActionRowBuilder,
	type APIRole,
	MentionableSelectMenuBuilder,
	type MentionableSelectMenuInteraction,
	type ModalMessageModalSubmitInteraction,
	OverwriteType,
	type Role,
	type User,
	type VoiceChannel,
} from 'discord.js';
import {
	Button,
	type ButtonContext,
	Context,
	type ISelectedRoles,
	type ISelectedUsers,
	MentionableSelect,
	type MentionableSelectContext,
	Modal,
	type ModalContext,
	SelectedRoles,
	SelectedUsers,
} from 'necord';
import { PrivateButtonStrings } from '../../constants/private-button-strings.const.js';
import { PrivatesService } from '../../privates.service.js';

@Injectable()
export class PrivateMuteOrUnmuteController {
	public constructor (
		private readonly privatesService: PrivatesService,
	) {}

	@Button(`privateAction/${PrivateButtonType.MUTE_UNMUTE}`)
	public async onMuteOrUnmuteButton (
		@Context() [interaction]: ButtonContext,
	): Promise<void> {
		if (!await this.privatesService.isUserHavePrivateChannel(interaction.guildId!, interaction.user.id)) {
			await interaction.reply({
				embeds: [
					baseEmbed()
						.setTitle(PrivateButtonStrings[PrivateButtonType.MUTE_UNMUTE])
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
					.setTitle(PrivateButtonStrings[PrivateButtonType.MUTE_UNMUTE])
					.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
					.setDescription(`${interaction.user.toString()}, **выберите** пользователя или роль, которому(ой) Вы хотите **выдать** или **забрать** право говорить в Вашей комнате`),
			],
			components: [
				new ActionRowBuilder<MentionableSelectMenuBuilder>()
					.addComponents(
						new MentionableSelectMenuBuilder()
							.setPlaceholder('Выберите пользователя или роль')
							.setCustomId('privateMuteOrUnmuteChoose')
							.setMaxValues(1),
					),
				byIdButtonRow('privateMuteOrUnmuteById'),
			],
			ephemeral: true,
		});
	}

	@MentionableSelect('privateMuteOrUnmuteChoose')
	public async onMentionableSelect (
		@Context() [interaction]: MentionableSelectContext,
		@SelectedUsers() users: ISelectedUsers,
		@SelectedRoles() roles: ISelectedRoles,
	): Promise<void> {
		const selected = users.first() ?? roles.first();
		if (!selected) {
			return;
		}

		await this.toggleMute(interaction, selected);
	}

	@Button('privateMuteOrUnmuteById')
	public async onByIdButton (
		@Context() [interaction]: ButtonContext,
	): Promise<void> {
		await interaction.showModal(userIdModal('privateMuteOrUnmuteByIdModal', PrivateButtonStrings[PrivateButtonType.MUTE_UNMUTE]));
	}

	@Modal('privateMuteOrUnmuteByIdModal')
	public async onByIdModal (
		@Context() [interaction]: ModalContext,
	): Promise<void> {
		if (!interaction.isFromMessage()) {
			return;
		}

		const member = await fetchMemberById(interaction.guild!, interaction.fields.getTextInputValue('userId'));

		if (!member) {
			await interaction.update({
				embeds: [
					baseEmbed()
						.setTitle(PrivateButtonStrings[PrivateButtonType.MUTE_UNMUTE])
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, пользователь с таким **ID не найден** на сервере`),
				],
			});

			return;
		}

		await this.toggleMute(interaction, member.user);
	}

	private async toggleMute (
		interaction: MentionableSelectMenuInteraction | ModalMessageModalSubmitInteraction,
		selected: APIRole | Role | User,
	): Promise<void> {
		const privateChannel = await this.privatesService.getPrivateChannelByUser(interaction.guildId!, interaction.user.id);

		if (!privateChannel) {
			await interaction.update({
				embeds: [
					baseEmbed()
						.setTitle(PrivateButtonStrings[PrivateButtonType.MUTE_UNMUTE])
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
						.setTitle(PrivateButtonStrings[PrivateButtonType.ACCESS_GIVE_TAKE])
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, у Вас **нет** своей приватной комнаты`),
				],
				components: [],
			});

			return;
		}

		const isUnmuted = voiceChannel.permissionsFor(selected.id, false)?.has('Speak', false);

		if (isUnmuted && 'username' in selected && selected.id === interaction.user.id) {
			await interaction.update({
				embeds: [
					baseEmbed()
						.setTitle(PrivateButtonStrings[PrivateButtonType.ACCESS_TAKE])
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, Вы **не можете забрать право говорить** в Вашей приватной комнате **у самого себя**`),
				],
				components: [],
			});

			return;
		}

		await voiceChannel.permissionOverwrites.edit(selected.id, {
			Speak: !isUnmuted,
		}, {
			type: 'name' in selected ? OverwriteType.Role : OverwriteType.Member,
		});

		for (const voiceMember of voiceChannel.members.values()) {
			if (voiceMember.id === interaction.user.id) {
				continue;
			}

			if ('username' in selected) {
				if (voiceMember.id === selected.id) {
					await voiceMember.voice.disconnect().catch(() => {});
				}
			} else if (voiceMember.roles.cache.has(selected.id)) {
				await voiceMember.voice.disconnect();
			}
		}

		await interaction.update({
			embeds: [
				baseEmbed()
					.setTitle(isUnmuted ? PrivateButtonStrings[PrivateButtonType.MUTE] : PrivateButtonStrings[PrivateButtonType.UNMUTE])
					.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
					.setDescription(`${interaction.user.toString()}, Вы успешно **${isUnmuted ? 'забрали' : 'выдали'} доступ** ${'name' in selected ? `всем пользователям роли ${selected.toString()}` : `пользователю ${selected.toString()}`} в Вашу приватную комнату`),
			],
			components: [],
		});
	}
}
