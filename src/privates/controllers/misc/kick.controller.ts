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
				byIdButtonRow('privateKickById'),
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
		const selected = users.first() ?? roles.first();
		if (!selected) {
			return;
		}

		await this.kick(interaction, selected);
	}

	@Button('privateKickById')
	public async onByIdButton (
		@Context() [interaction]: ButtonContext,
	): Promise<void> {
		await interaction.showModal(userIdModal('privateKickByIdModal', PrivateButtonStrings[PrivateButtonType.KICK]));
	}

	@Modal('privateKickByIdModal')
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
						.setTitle(PrivateButtonStrings[PrivateButtonType.KICK])
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, пользователь с таким **ID не найден** на сервере`),
				],
			});

			return;
		}

		await this.kick(interaction, member.user);
	}

	private async kick (
		interaction: MentionableSelectMenuInteraction | ModalMessageModalSubmitInteraction,
		selected: APIRole | Role | User,
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
