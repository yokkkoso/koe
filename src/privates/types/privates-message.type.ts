import type { APIEmbed, APIMessageTopLevelComponent } from 'discord.js';

export interface PrivatesMessageDocument {
	content?: string;
	embeds?: APIEmbed[];
	components?: APIMessageTopLevelComponent[];
	flags?: number;
}
