import type { MessageModalContext } from '@shared/types/message-modal-context.type.js';
import { Injectable, UseGuards } from '@nestjs/common';
import { baseEmbed } from '@shared/constants/base-embed.const.js';
import { ExecutorGuard } from '@shared/guards/executor.guard.js';
import { ExpTimeGuard } from '@shared/guards/exp-time.guard.js';
import {
	ActionRowBuilder,
	type ButtonBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} from 'discord.js';
import { Button, type ButtonContext, ComponentParam, Context, Modal, ModalParam } from 'necord';
import { MessejiService } from '../../../messeji/messeji.service.js';
import { privatesPanelReturnButton } from '../../constants/buttons.const.js';
import { PrivatesService } from '../../privates.service.js';
import { validatePrivatesMessage } from '../../utils/validate-privates-message.util.js';

@Injectable()
export class PrivatesMessageImportController {
	public constructor (
		private readonly privatesService: PrivatesService,
		private readonly messejiService: MessejiService,
	) {}

	@UseGuards(ExpTimeGuard, ExecutorGuard)
	@Button('privatesMessageImport/:expTime/:executorId')
	public async onMessageImportButton (
		@Context() [interaction]: ButtonContext,
		@ComponentParam('expTime') expTime: string,
	): Promise<void> {
		await interaction.showModal(
			new ModalBuilder()
				.setCustomId(`privatesMessageImportModal/${expTime}/${interaction.user.id}`)
				.setTitle('Импортировать из Messēji')
				.addComponents([
					new ActionRowBuilder<TextInputBuilder>()
						.addComponents([
							new TextInputBuilder()
								.setLabel('Ссылка из Messēji или JSON')
								.setCustomId('source')
								.setPlaceholder('https://messeji.yokkkoso.me/s/…')
								.setMinLength(1)
								.setMaxLength(4000)
								.setStyle(TextInputStyle.Paragraph)
								.setRequired(),
						]),
				]),
		);
	}

	@UseGuards(ExpTimeGuard, ExecutorGuard)
	@Modal('privatesMessageImportModal/:expTime/:executorId')
	public async onModal (
		@Context() [interaction]: MessageModalContext,
		@ModalParam('expTime') expTime: string,
	): Promise<void> {
		await interaction.deferUpdate();

		const source = interaction.fields.getTextInputValue('source').trim();

		let raw: unknown;

		try {
			const slug = this.messejiService.extractSlug(source);

			if (slug) {
				raw = await this.messejiService.fetchShared(slug);
			} else if (source.startsWith('{')) {
				raw = JSON.parse(source);
			} else {
				throw new Error('это не похоже ни на ссылку Messēji, ни на JSON');
			}
		} catch (error) {
			await interaction.editReply({
				embeds: [
					baseEmbed()
						.setTitle('Импортировать из Messēji')
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, не удалось получить сообщение: ${error instanceof Error ? error.message : String(error)}`),
				],
				components: [new ActionRowBuilder<ButtonBuilder>().addComponents(privatesPanelReturnButton(interaction.user.id, expTime))],
			});

			return;
		}

		const result = validatePrivatesMessage(raw);

		if ('error' in result) {
			await interaction.editReply({
				embeds: [
					baseEmbed()
						.setTitle('Импортировать из Messēji')
						.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
						.setDescription(`${interaction.user.toString()}, Koe не принял сообщение: ${result.error}`),
				],
				components: [new ActionRowBuilder<ButtonBuilder>().addComponents(privatesPanelReturnButton(interaction.user.id, expTime))],
			});

			return;
		}

		await this.privatesService.updateMessage(interaction.guildId!, result.document);

		await interaction.editReply({
			embeds: [
				baseEmbed()
					.setTitle('Импортировать из Messēji')
					.setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
					.setDescription(`${interaction.user.toString()}, сообщение **сохранено**. Проверьте его через «Предпросмотр» и отправьте в канал`),
			],
			components: [new ActionRowBuilder<ButtonBuilder>().addComponents(privatesPanelReturnButton(interaction.user.id, expTime))],
		});
	}
}
