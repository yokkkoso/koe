import { PrivatesConfig } from '@config/privates.config.js';
import { Injectable, UseGuards } from '@nestjs/common';
import { AdministratorGuard } from '@shared/guards/administrator.guard.js';
import { Context, SlashCommand, type SlashCommandContext } from 'necord';
import { PrivatesPanelFactory } from '../factory/privates-panel.factory.js';

@Injectable()
export class PrivatesCommand {
	public constructor (
		private readonly privatesPanelFactory: PrivatesPanelFactory,
	) {}

	@UseGuards(AdministratorGuard)
	@SlashCommand({
		name: 'privates',
		description: 'Настройка приватных каналов',
		defaultMemberPermissions: 'Administrator',
		dmPermission: false,
	})
	public async onPrivatesCommand (
		@Context() [interaction]: SlashCommandContext,
	): Promise<void> {
		if (!PrivatesConfig.guilds[interaction.guildId!]) {
			return;
		}

		await interaction.deferReply();

		const panel = await this.privatesPanelFactory.generatePanel(interaction.guildId!, interaction.user);

		await interaction.editReply(panel);
	}
}
