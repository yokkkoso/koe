import type { Snowflake } from 'discord.js';

export interface PrivatesConfigInterface {
	guilds: Record<Snowflake, GuildEntry>;
}

interface GuildEntry {
	adminUserIds: Snowflake[];
	adminRoleIds: Snowflake[];
	joinChannelIds: Snowflake[];
}
