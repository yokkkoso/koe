import { PrivatesConfig } from '@config/privates.config.js';
import { Injectable, UseGuards } from '@nestjs/common';
import { ExecutorGuard } from '@shared/guards/executor.guard.js';
import { ExpTimeGuard } from '@shared/guards/exp-time.guard.js';
import { Button, type ButtonContext, Context } from 'necord';
import { PrivatesPanelFactory } from '../../factory/privates-panel.factory.js';

@Injectable()
export class PrivatesPanelReturnController {
	public constructor (
		private readonly privatesPanelFactory: PrivatesPanelFactory,
	) {}

	@UseGuards(ExpTimeGuard, ExecutorGuard)
	@Button('privatesPanelReturn/:expTime/:executorId')
	public async onPanelReturnButton (
		@Context() [interaction]: ButtonContext,
	): Promise<void> {
		if (!PrivatesConfig.guilds[interaction.guildId!]) {
			return;
		}

		await interaction.deferUpdate();

		const panel = await this.privatesPanelFactory.generatePanel(interaction.guildId!, interaction.user);

		await interaction.editReply(panel);
	}
}
