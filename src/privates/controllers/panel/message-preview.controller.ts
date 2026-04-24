import { Injectable, UseGuards } from '@nestjs/common';
import { ExecutorGuard } from '@shared/guards/executor.guard.js';
import { ExpTimeGuard } from '@shared/guards/exp-time.guard.js';
import { Button, type ButtonContext, Context } from 'necord';
import { PrivateMessageFactory } from '../../factory/private-message.factory.js';

@Injectable()
export class PrivatesMessagePreviewController {
	public constructor (
		private readonly privateMessageFactory: PrivateMessageFactory,
	) {}

	@UseGuards(ExpTimeGuard, ExecutorGuard)
	@Button('privatesMessagePreview/:expTime/:executorId')
	public async onMessagePreviewButton (
		@Context() [interaction]: ButtonContext,
	): Promise<void> {
		const { embed, components } = await this.privateMessageFactory.generateMessage(interaction.guildId!, true);

		await interaction.reply({
			embeds: [embed],
			components,
			ephemeral: true,
		}).catch(() => {});
	}
}
