import type { ColorResolvable, Snowflake } from 'discord.js';

export interface MainConfigInterface {
	adminUserIds: Snowflake[];
	color: ColorResolvable;
}
