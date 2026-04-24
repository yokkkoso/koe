import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { Options } from 'discord.js';
import { NecordModule } from 'necord';
import { BotController } from './bot.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { PrivatesModule } from './privates/privates.module.js';
import { NecordExceptionFilter } from './shared/filters/necord-exceptions.filter.js';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		PrismaModule.forRoot(),
		ScheduleModule.forRoot(),
		NecordModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				token: configService.getOrThrow<string>('DISCORD_TOKEN'),
				prefix: '!',
				intents: [
					'Guilds',
					'GuildMessages',
					'MessageContent',
					'GuildMembers',
					'GuildVoiceStates',
				],
				makeCache: Options.cacheWithLimits({
					...Options.DefaultMakeCacheSettings,
					MessageManager: 0,
					PresenceManager: 0,
					GuildStickerManager: 0,
					GuildBanManager: 0,
					GuildInviteManager: 0,
					GuildEmojiManager: 0,
					ReactionManager: 0,
					GuildScheduledEventManager: 0,
					AutoModerationRuleManager: 0,
					UserManager: {
						maxSize: 1,
						keepOverLimit: (user) => user.id === user.client.user.id,
					},
				}),
				sweepers: {
					...Options.DefaultSweeperSettings,
					guildMembers: {
						interval: 1800,
						filter: () => (member) =>
							(member.user.bot && member.id !== member.client.user.id)
							|| (!member.voice.channelId && !member.user.bot),
					},
					users: {
						interval: 1800,
						filter: () => (user) => user.bot && user.id !== user.client.user.id,
					},
					voiceStates: {
						interval: 1800,
						filter: () => (voice) => !voice.channelId && voice.id !== voice.client.user.id,
					},
				},
			}),
		}),
		PrivatesModule,
	],

	providers: [
		BotController,
		{
			provide: APP_FILTER,
			useClass: NecordExceptionFilter,
		},
	],
})
export class BotModule {}
