import { Injectable } from '@nestjs/common';
import { baseEmbed } from '@shared/constants/base-embed.const.js';
import { getExpTime } from '@shared/utils/get-exp-time.util.js';
import {
	ActionRowBuilder,
	type ButtonBuilder,
	type EmbedBuilder,
	hyperlink,
	type Snowflake,
	type User,
} from 'discord.js';
import { dedent } from 'ts-dedent';
import { MessejiService } from '../../messeji/messeji.service.js';
import {
	privatesMessageImport,
	privatesMessageMigrate,
	privatesMessageOpen,
	privatesMessagePreview,
	privatesMessageReset,
	privatesMessageSend,
} from '../constants/buttons.const.js';
import { PrivateButtonStrings } from '../constants/private-button-strings.const.js';
import { PrivatesService } from '../privates.service.js';
import { collectPrivateActions } from '../utils/validate-privates-message.util.js';
import { PrivateMessageFactory } from './private-message.factory.js';

const DRAFT_URL_LIMIT = 3000;

@Injectable()
export class PrivatesPanelFactory {
	public constructor (
		private readonly privatesService: PrivatesService,
		private readonly privateMessageFactory: PrivateMessageFactory,
		private readonly messejiService: MessejiService,
	) {}

	public async generatePanel (
		guildId: Snowflake,
		user: User,
	): Promise<{
		embeds: EmbedBuilder[];
		components: ActionRowBuilder<ButtonBuilder>[];
	}> {
		const config = await this.privatesService.getPrivateConfig(guildId);
		const document = await this.privateMessageFactory.generateMessage(guildId);
		const actions = collectPrivateActions(document.components ?? []);
		const expTime = getExpTime();

		const shortUrl = await this.messejiService.buildShortUrl(document);
		const draftUrl = this.messejiService.buildDraftUrl(document);

		const openStep = shortUrl
			? 'Нажмите «Открыть в Messēji»'
			: draftUrl.length <= DRAFT_URL_LIMIT
				? hyperlink('Откройте конструктор Messēji', draftUrl)
				: 'Откройте конструктор Messēji (сообщение слишком большое для ссылки - задайте MESSEJI_API_TOKEN)';

		const actionsString = actions.length > 0
			? actions.map((action, index) => `**${index + 1}**) ${PrivateButtonStrings[action]}`).join('\n')
			: 'Нет ни одной кнопки';

		const description = dedent`
			Сообщение: ${config.message ? '**собрано в Messēji**' : config.buttons.length > 0 ? '**старая настройка** (кнопки из /privates до Messēji) - нажмите «Перенести старую настройку», чтобы зафиксировать её в новом формате' : '**стандартное**'}

			**Как изменить**
			1) ${openStep} - текущее сообщение уже будет внутри
			2) Соберите вид и кнопки, нажмите «Скопировать для Koe»
			3) Здесь нажмите «Импортировать из Messēji» и вставьте ссылку

			**Кнопки** (${actions.length}):
			${actionsString}
		`;

		const firstRow = new ActionRowBuilder<ButtonBuilder>();

		if (shortUrl) {
			firstRow.addComponents(privatesMessageOpen(shortUrl));
		}

		firstRow.addComponents(privatesMessageImport(user.id, expTime));

		if (!config.message && config.buttons.length > 0) {
			firstRow.addComponents(privatesMessageMigrate(user.id, expTime));
		}

		const secondRow = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(
				privatesMessagePreview(user.id, expTime),
				privatesMessageSend(user.id, expTime),
			);

		if (config.message) {
			secondRow.addComponents(privatesMessageReset(user.id, expTime));
		}

		return {
			embeds: [
				baseEmbed()
					.setTitle('Настройка сообщения для управления приватным каналом')
					.setThumbnail(user.displayAvatarURL({ extension: 'png' }))
					.setDescription(description),
			],
			components: [firstRow, secondRow],
		};
	}
}
