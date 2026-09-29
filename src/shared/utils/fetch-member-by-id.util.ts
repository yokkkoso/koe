import type { Guild, GuildMember } from 'discord.js';

export async function fetchMemberById (guild: Guild, userId: string): Promise<GuildMember | null> {
	const id = userId.trim();

	if (!/^\d{15,20}$/.test(id)) {
		return null;
	}

	return guild.members.fetch(id).catch(() => null);
}
