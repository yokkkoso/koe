import { Injectable } from '@nestjs/common';
import { PrivateButtonType } from '@prisma-client';
import { baseEmbed } from '@shared/constants/base-embed.const.js';
import { OverwriteType, type VoiceChannel } from 'discord.js';
import { Button, type ButtonContext, Context } from 'necord';
import { PrivateButtonStrings } from '../../constants/private-button-strings.const.js';
import { PrivatesService } from '../../privates.service.js';

@Injectable()
export class PrivateHideOrShowController {
	public constructor (
		private readonly privatesService: PrivatesService,
	) {}

	@Button(`privateAction/${PrivateButtonType.HIDE_SHOW}`)
	public async onHideOrShowButton (
		@Context() [interaction]: ButtonContext,
	): Promise<void> {
		const privateChannel = await this.privatesService.getPrivateChannelByUser(interaction.guildId!, interaction.user.id);

		if (!privateChannel) {
			await interaction.reply({
				embeds: [
					baseEmbed()
						.setTitle(PrivateButtonStrings[PrivateButtonType.HIDE_SHOW])
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
						.setTitle(PrivateButtonStrings[PrivateButtonType.HIDE_SHOW])
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, у Вас **нет** своей приватной комнаты`),
				],
				ephemeral: true,
			});

			return;
		}

		const isShowen = voiceChannel.permissionsFor(interaction.guild!.roles.everyone.id, false)?.has('ViewChannel', false);

		await voiceChannel.permissionOverwrites.edit(interaction.guild!.roles.everyone.id, {
			ViewChannel: !isShowen,
		}, {
			type: OverwriteType.Role,
		});

		await interaction.reply({
			embeds: [
				baseEmbed()
					.setTitle(isShowen ? PrivateButtonStrings[PrivateButtonType.HIDE] : PrivateButtonStrings[PrivateButtonType.SHOW])
					.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
					.setDescription(`${interaction.user.toString()}, Вы успешно **${isShowen ? 'скрыли' : 'отобразили'}** Вашу приватную комнату для всех`),
			],
			ephemeral: true,
		});
	}
}
