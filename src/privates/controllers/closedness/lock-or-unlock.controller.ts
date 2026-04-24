import { Injectable } from '@nestjs/common';
import { PrivateButtonType } from '@prisma-client';
import { baseEmbed } from '@shared/constants/base-embed.const.js';
import { OverwriteType, type VoiceChannel } from 'discord.js';
import { Button, type ButtonContext, Context } from 'necord';
import { PrivateButtonStrings } from '../../constants/private-button-strings.const.js';
import { PrivatesService } from '../../privates.service.js';

@Injectable()
export class PrivateLockOrUnlockController {
	public constructor (
		private readonly privatesService: PrivatesService,
	) {}

	@Button(`privateAction/${PrivateButtonType.LOCK_UNLOCK}`)
	public async onLockOrUnlockButton (
		@Context() [interaction]: ButtonContext,
	): Promise<void> {
		const privateChannel = await this.privatesService.getPrivateChannelByUser(interaction.guildId!, interaction.user.id);

		if (!privateChannel) {
			await interaction.reply({
				embeds: [
					baseEmbed()
						.setTitle(PrivateButtonStrings[PrivateButtonType.LOCK_UNLOCK])
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
						.setTitle(PrivateButtonStrings[PrivateButtonType.LOCK_UNLOCK])
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, у Вас **нет** своей приватной комнаты`),
				],
				ephemeral: true,
			});

			return;
		}

		const isUnlocked = voiceChannel.permissionsFor(interaction.guild!.roles.everyone.id, false)?.has('Connect', false);

		await voiceChannel.permissionOverwrites.edit(interaction.guild!.roles.everyone.id, {
			Connect: !isUnlocked,
		}, {
			type: OverwriteType.Role,
		});

		await interaction.reply({
			embeds: [
				baseEmbed()
					.setTitle(isUnlocked ? PrivateButtonStrings[PrivateButtonType.LOCK] : PrivateButtonStrings[PrivateButtonType.UNLOCK])
					.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
					.setDescription(`${interaction.user.toString()}, Вы успешно **${isUnlocked ? 'закрыли' : 'открыли'}** Вашу приватную комнату для всех`),
			],
			ephemeral: true,
		});
	}
}
