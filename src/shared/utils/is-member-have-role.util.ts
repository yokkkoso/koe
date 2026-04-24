import type { GuildMember, Snowflake } from 'discord.js';

export function isMemberHaveRole (member: GuildMember, roles: Snowflake[]): boolean {
	return member.roles.cache.filter((role) => roles.includes(role.id)).size > 0;
}
