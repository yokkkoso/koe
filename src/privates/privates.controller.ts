import { MainConfig } from '@config/main.config.js';
import { PrivatesConfig } from '@config/privates.config.js';
import { Injectable } from '@nestjs/common';
import { AuditLogEvent, type GuildAuditLogs, type GuildChannel, type Snowflake, type VoiceChannel } from 'discord.js';
import { Context, type ContextOf, On, Once } from 'necord';
import { privatesLocker } from './constants/privates-locker.const.js';
import { PrivatesService } from './privates.service.js';

@Injectable()
export class PrivatesController {
	public constructor (
		private readonly privatesService: PrivatesService,
	) {}

	@Once('clientReady')
	public async onReady (
		@Context() [client]: ContextOf<'clientReady'>,
	): Promise<void> {
		for (const guildId of Object.keys(PrivatesConfig)) {
			const guild = client.guilds.cache.get(guildId);
			if (!guild) {
				continue;
			}

			const privateChannels = await this.privatesService.getPrivateChannels(guildId);

			for (const privateChannel of privateChannels) {
				const channel = guild.channels.cache.get(privateChannel.channelId) as VoiceChannel | undefined;

				if (!channel) {
					await this.privatesService.deletePrivateChannel(privateChannel.channelId);

					continue;
				}

				if (channel.members.filter((member) => !member.user.bot).size <= 0) {
					await channel.delete().catch(() => {});

					await this.privatesService.deletePrivateChannel(privateChannel.channelId);
				}
			}
		}
	}

	@On('channelDelete')
	public async onChannelDelete (
		@Context() [channel]: ContextOf<'channelDelete'>,
	): Promise<void> {
		if (!channel.isVoiceBased()) {
			return;
		}

		await this.privatesService.deletePrivateChannel(channel.id);
	}

	@On('guildChannelPermissionsUpdate')
	public async onChannelPermissionsUpdate (
		@Context() [channel, oldPermissions]: ContextOf<'guildChannelPermissionsUpdate'>,
	): Promise<void> {
		const privateChannel = await this.privatesService.getPrivateChannel(channel.id);

		if (!privateChannel) {
			return;
		}

		const auditLogEntries = await Promise.all([
			(channel as GuildChannel).guild.fetchAuditLogs({
				limit: 5,
				type: AuditLogEvent.ChannelOverwriteUpdate,
			}),
			(channel as GuildChannel).guild.fetchAuditLogs({
				limit: 5,
				type: AuditLogEvent.ChannelOverwriteCreate,
			}),
		]).then((arr) => arr.flat());

		let executorId: Snowflake | undefined;

		for (const auditLogTypeEntries of auditLogEntries) {
			if (!auditLogTypeEntries || auditLogTypeEntries.entries.size <= 0) {
				return;
			}

			const auditLogEntry = (auditLogTypeEntries as GuildAuditLogs<AuditLogEvent.ChannelOverwriteUpdate>).entries.find((entry) => entry.target?.id === channel.id
				&& Date.now() - entry.createdAt.getTime() <= 3000);

			executorId = auditLogEntry?.executorId ?? undefined;

			if (executorId) {
				break;
			}
		}

		if (!executorId) {
			return;
		}

		if (
			executorId !== channel.client.user.id
			&& executorId !== privateChannel.userId
			&& !MainConfig.adminUserIds.includes(executorId)
		) {
			await (channel as GuildChannel).edit({
				permissionOverwrites: oldPermissions.cache,
			});
		}
	}

	@On('voiceChannelLeave')
	public async onVoiceChannelLeave (
		@Context() [, channel]: ContextOf<'voiceChannelLeave'>,
	): Promise<void> {
		if (channel.members.filter((member) => !member.user.bot).size <= 0) {
			if (!await this.privatesService.isPrivateChannel(channel.id)) {
				return;
			}

			await privatesLocker.acquire();

			try {
				await this.privatesService.deletePrivateChannel(channel.id);

				await channel.delete().catch(() => {});
			} finally {
				privatesLocker.release();
			}
		}
	}

	@On('voiceChannelJoin')
	public async onVoiceChannelJoin (
		@Context() [member, channel]: ContextOf<'voiceChannelJoin'>,
	): Promise<void> {
		const guildConfig = PrivatesConfig.guilds[member.guild.id];
		if (!guildConfig) {
			return;
		}

		if (guildConfig.joinChannelIds.includes(channel.id)) {
			if (member.user.bot) {
				await member.voice.disconnect().catch(() => {});

				return;
			}

			await privatesLocker.acquire();

			try {
				const existingPrivateChannel = await this.privatesService.getPrivateChannelByUser(member.guild.id, member.id);

				if (existingPrivateChannel) {
					await member.voice.setChannel(existingPrivateChannel.channelId).catch(() => {});
				} else {
					await this.privatesService.createPrivateChannel(member, channel);
				}
			} finally {
				privatesLocker.release();
			}

			return;
		}

		if (await this.privatesService.isPrivateChannel(channel.id)) {
			if (member.user.bot || MainConfig.adminUserIds.includes(member.id)) {
				return;
			}

			const permissions = channel.permissionsFor(member.id, false);

			if (
				permissions
				&& (
					!permissions.has('Connect', false)
					|| !permissions.has('ViewChannel', false)
				)
			) {
				await member.voice.disconnect('Подключение в закрытый приватный канал').catch(() => {});
			}
		}
	}

	@On('voiceChannelSwitch')
	public async onVoiceChannelSwitch (
		@Context() [member, oldChannel, newChannel]: ContextOf<'voiceChannelSwitch'>,
	): Promise<void> {
		const guildConfig = PrivatesConfig.guilds[member.guild.id];
		if (!guildConfig) {
			return;
		}

		if (guildConfig.joinChannelIds.includes(newChannel.id)) {
			if (member.user.bot) {
				await member.voice.disconnect().catch(() => {});

				return;
			}

			await privatesLocker.acquire();

			try {
				const existingPrivateChannel = await this.privatesService.getPrivateChannelByUser(member.guild.id, member.id);

				if (existingPrivateChannel) {
					await member.voice.setChannel(existingPrivateChannel.channelId).catch(() => {});
				} else {
					await this.privatesService.createPrivateChannel(member, newChannel);
				}
			} finally {
				privatesLocker.release();
			}

			return;
		}

		if (
			oldChannel.members.filter((member) => !member.user.bot).size <= 0
			&& await this.privatesService.isPrivateChannel(oldChannel.id)
		) {
			await oldChannel.delete().catch(() => {});

			await this.privatesService.deletePrivateChannel(oldChannel.id);
		}

		if (await this.privatesService.isPrivateChannel(newChannel.id)) {
			if (member.user.bot || MainConfig.adminUserIds.includes(member.id)) {
				return;
			}

			const permissions = newChannel.permissionsFor(member.id, false);

			if (
				permissions
				&& (
					!permissions.has('Connect', false)
					|| !permissions.has('ViewChannel', false)
				)
			) {
				await member.voice.disconnect('Подключение в закрытый приватный канал').catch(() => {});
			}
		}
	}
}
