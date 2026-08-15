import type { PrivateChannel } from '@prisma-client';
import type { PrivatesMessageDocument } from './types/privates-message.type.js';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma-client';
import {
	ChannelType,
	type GuildChannelCreateOptions,
	type GuildMember,
	OverwriteType,
	type Snowflake,
	type VoiceBasedChannel,
} from 'discord.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PrivatesService {
	public constructor (
		private readonly prismaService: PrismaService,
	) {}

	public async createPrivateChannel (member: GuildMember, channel: VoiceBasedChannel): Promise<void> {
		const voiceChannelOptions: GuildChannelCreateOptions & { type: ChannelType.GuildVoice } = {
			name: member.user.username,
			type: ChannelType.GuildVoice,
			parent: channel.parentId ?? undefined,
			permissionOverwrites: [{
				id: member.id,
				type: OverwriteType.Member,
				allow: [
					'Connect',
					'Speak',
					'Stream',
					'ViewChannel',
					'UseEmbeddedActivities',
				],
			}, {
				id: member.guild.roles.everyone.id,
				type: OverwriteType.Role,
				allow: [
					'Connect',
					'Speak',
					'Stream',
					'ViewChannel',
					'UseEmbeddedActivities',
				],
			}],
		};

		const voiceChannel = await member.guild.channels.create(voiceChannelOptions)
			.catch(async () => {
				voiceChannelOptions.name = 'Приватный канал';

				return member.guild.channels.create(voiceChannelOptions);
			});

		await this.prismaService.privateChannel.create({
			data: {
				guildId: member.guild.id,
				userId: member.id,
				channelId: voiceChannel.id,
			},
		});

		await member.voice.setChannel(voiceChannel.id, 'Создание приватного канала')
			.catch(async () => {
				await this.prismaService.privateChannel.delete({
					where: {
						channelId: voiceChannel.id,
					},
				});

				await voiceChannel.delete().catch(() => {});
			});
	}

	public async updatePrivateChannelOwner (channelId: Snowflake, userId: Snowflake): Promise<void> {
		await this.prismaService.privateChannel.update({
			where: {
				channelId,
			},
			data: {
				userId,
			},
		});
	}

	public async updatePrivateChannelRenameCooldown (channelId: Snowflake, cooldown = 600_000): Promise<void> {
		await this.prismaService.privateChannel.update({
			where: {
				channelId,
			},
			data: {
				renameAt: new Date(Date.now() + cooldown),
			},
		});
	}

	public async deletePrivateChannel (channelId: Snowflake): Promise<void> {
		await this.prismaService.privateChannel.deleteMany({
			where: {
				channelId,
			},
		});
	}

	public async getPrivateChannel (channelId: Snowflake): Promise<PrivateChannel | null> {
		return this.prismaService.privateChannel.findFirst({
			where: {
				channelId,
			},
		});
	}

	public async getPrivateChannelByUser (guildId: Snowflake, userId: Snowflake): Promise<PrivateChannel | null> {
		return this.prismaService.privateChannel.findFirst({
			where: {
				guildId,
				userId,
			},
		});
	}

	public async getPrivateConfig (guildId: Snowflake) {
		return this.prismaService.privatesConfig.upsert({
			where: {
				guildId,
			},
			update: {
				guildId,
			},
			create: {
				guildId,
			},
			include: {
				buttons: true,
			},
		});
	}

	public async updateMessage (guildId: Snowflake, message: PrivatesMessageDocument | null): Promise<void> {
		const data = message === null ? Prisma.DbNull : message as unknown as Prisma.InputJsonObject;

		await this.prismaService.privatesConfig.upsert({
			where: {
				guildId,
			},
			update: {
				message: data,
			},
			create: {
				guildId,
				message: data,
			},
		});
	}

	public async getPrivateChannels (guildId: Snowflake): Promise<PrivateChannel[]> {
		return this.prismaService.privateChannel.findMany({
			where: {
				guildId,
			},
		});
	}

	public async isPrivateChannel (channelId: Snowflake): Promise<boolean> {
		return this.prismaService.privateChannel.findFirst({
			where: {
				channelId,
			},
		}).then(Boolean);
	}

	public async isUserHavePrivateChannel (guildId: Snowflake, userId: Snowflake): Promise<boolean> {
		return this.prismaService.privateChannel.findFirst({
			where: {
				guildId,
				userId,
			},
		}).then(Boolean);
	}
}
