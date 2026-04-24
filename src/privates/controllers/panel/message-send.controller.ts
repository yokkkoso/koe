import { Injectable, UseGuards } from '@nestjs/common';
import { baseEmbed } from '@shared/constants/base-embed.const.js';
import { ExecutorGuard } from '@shared/guards/executor.guard.js';
import { ExpTimeGuard } from '@shared/guards/exp-time.guard.js';
import {
	ActionRowBuilder,
	type ButtonBuilder,
	ChannelSelectMenuBuilder,
	ChannelType,
	type TextBasedChannel,
	TextChannel,
} from 'discord.js';
import {
	Button,
	type ButtonContext,
	ChannelSelect,
	type ChannelSelectContext,
	ComponentParam,
	Context,
	type ISelectedChannels,
	SelectedChannels,
} from 'necord';
import { privatesPanelReturnButton } from '../../constants/buttons.const.js';
import { PrivateMessageFactory } from '../../factory/private-message.factory.js';

@Injectable()
export class PrivatesMessageSendController {
	public constructor (
		private readonly privateMessageFactory: PrivateMessageFactory,
	) {}

	@UseGuards(ExpTimeGuard, ExecutorGuard)
	@Button('privatesMessageSend/:expTime/:executorId')
	public async onMessageSendButton (
		@Context() [interaction]: ButtonContext,
		@ComponentParam('expTime') expTime: string,
	): Promise<void> {
		await interaction.update({
			embeds: [
				baseEmbed()
					.setTitle('Отправить сообщение')
					.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
					.setDescription(`${interaction.user.toString()}, **выберите** канал, куда Вы хотите отправить сообщение для настройки приватного канала`),
			],
			components: [
				new ActionRowBuilder<ChannelSelectMenuBuilder>()
					.addComponents(
						new ChannelSelectMenuBuilder()
							.setCustomId(`privatesMessageSendChoose/${expTime}/${interaction.user.id}`)
							.setPlaceholder('Выберите канал')
							.setMaxValues(1)
							.setChannelTypes([ChannelType.GuildText, ChannelType.GuildVoice]),
					),
				new ActionRowBuilder<ButtonBuilder>().addComponents(privatesPanelReturnButton(interaction.user.id, expTime)),
			],
		});
	}

	@UseGuards(ExpTimeGuard, ExecutorGuard)
	@ChannelSelect('privatesMessageSendChoose/:expTime/:executorId')
	public async onChannelSelect (
		@Context() [interaction]: ChannelSelectContext,
		@ComponentParam('expTime') expTime: string,
		@SelectedChannels() channels: ISelectedChannels,
	): Promise<void> {
		const selected = channels.first() as TextBasedChannel;

		const { embed, components } = await this.privateMessageFactory.generateMessage(interaction.guildId!);

		try {
			await (selected as TextChannel).send({
				embeds: [embed],
				components,
			});

			await interaction.update({
				embeds: [
					baseEmbed()
						.setTitle('Отправить сообщение')
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, сообщение **успешно** отправлено в канал ${selected.toString()}`),
				],
				components: [new ActionRowBuilder<ButtonBuilder>().addComponents(privatesPanelReturnButton(interaction.user.id, expTime))],
			}).catch(() => {});
		} catch (error) {
			await interaction.update({
				embeds: [
					baseEmbed()
						.setTitle('Отправить сообщение')
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, произошла ошибка при отправке сообщения: ${error}`),
				],
				components: [new ActionRowBuilder<ButtonBuilder>().addComponents(privatesPanelReturnButton(interaction.user.id, expTime))],
			});
		}
	}
}
