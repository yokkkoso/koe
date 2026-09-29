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
export class PrivateUnmuteController {
	public constructor (
		private readonly privatesService: PrivatesService,
	) {}

	@Button(`privateAction/${PrivateButtonType.UNMUTE}`)
	public async onUnmuteButton (
		@Context() [interaction]: ButtonContext,
	): Promise<void> {
		if (!await this.privatesService.isUserHavePrivateChannel(interaction.guildId!, interaction.user.id)) {
			await interaction.reply({
				embeds: [
					baseEmbed()
						.setTitle(PrivateButtonStrings[PrivateButtonType.UNMUTE])
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
					.setTitle(PrivateButtonStrings[PrivateButtonType.UNMUTE])
					.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
					.setDescription(`${interaction.user.toString()}, **выберите** пользователя или роль, у которого(ой) Вы хотите **забрать** право говорить в Вашей комнате`),
			],
			components: [
				new ActionRowBuilder<MentionableSelectMenuBuilder>()
					.addComponents(
						new MentionableSelectMenuBuilder()
							.setPlaceholder('Выберите пользователя или роль')
							.setCustomId('privateUnmuteChoose')
							.setMaxValues(1),
					),
				byIdButtonRow('privateUnmuteById'),
			],
			ephemeral: true,
		});
	}

	@MentionableSelect('privateUnmuteChoose')
	public async onMentionableSelect (
		@Context() [interaction]: MentionableSelectContext,
		@SelectedUsers() users: ISelectedUsers,
		@SelectedRoles() roles: ISelectedRoles,
	): Promise<void> {
		const selected = users.first() ?? roles.first();
		if (!selected) {
			return;
		}

		await this.unmute(interaction, selected);
	}

	@Button('privateUnmuteById')
	public async onByIdButton (
		@Context() [interaction]: ButtonContext,
	): Promise<void> {
		await interaction.showModal(userIdModal('privateUnmuteByIdModal', PrivateButtonStrings[PrivateButtonType.UNMUTE]));
	}

	@Modal('privateUnmuteByIdModal')
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
						.setTitle(PrivateButtonStrings[PrivateButtonType.UNMUTE])
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, пользователь с таким **ID не найден** на сервере`),
				],
			});

			return;
		}

		await this.unmute(interaction, member.user);
	}

	private async unmute (
		interaction: MentionableSelectMenuInteraction | ModalMessageModalSubmitInteraction,
		selected: APIRole | Role | User,
	): Promise<void> {
		const privateChannel = await this.privatesService.getPrivateChannelByUser(interaction.guildId!, interaction.user.id);

		if (!privateChannel) {
			await interaction.update({
				embeds: [
					baseEmbed()
						.setTitle(PrivateButtonStrings[PrivateButtonType.UNMUTE])
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
						.setTitle(PrivateButtonStrings[PrivateButtonType.UNMUTE])
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, у Вас **нет** своей приватной комнаты`),
				],
				components: [],
			});

			return;
		}

		if (voiceChannel.permissionsFor(selected.id, false)?.has('Speak', false)) {
			await interaction.update({
				embeds: [
					baseEmbed()
						.setTitle(PrivateButtonStrings[PrivateButtonType.UNMUTE])
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, У ${selected.toString()} **уже есть право говорить** в Вашей приватной комнате`),
				],
				components: [],
			});

			return;
		}

		await voiceChannel.permissionOverwrites.edit(selected.id, {
			Speak: true,
		}, {
			type: 'name' in selected ? OverwriteType.Role : OverwriteType.Member,
		});

		for (const voiceMember of voiceChannel.members.values()) {
			if (voiceMember.id === interaction.user.id) {
				continue;
			}

			if ('username' in selected) {
				if (voiceMember.id === selected.id) {
					await voiceMember.voice.setChannel(voiceChannel.id).catch(() => {});
				}
			} else if (voiceMember.roles.cache.has(selected.id)) {
				await voiceMember.voice.setChannel(voiceChannel.id).catch(() => {});
			}
		}

		await interaction.update({
			embeds: [
				baseEmbed()
					.setTitle(PrivateButtonStrings[PrivateButtonType.UNMUTE])
					.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
					.setDescription(`${interaction.user.toString()}, Вы успешно **выдали право говорить** ${'name' in selected ? `всем пользователям роли ${selected.toString()}` : `пользователю ${selected.toString()}`} в Вашей приватной комнате`),
			],
			components: [],
		});
	}
}
