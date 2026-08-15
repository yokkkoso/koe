import type { GuildMember } from 'discord.js';
import { MainConfig } from '@config/main.config.js';
import { PrivatesConfig } from '@config/privates.config.js';
import { isMemberHaveRole } from './is-member-have-role.util.js';

export function isPrivatesAdmin (member: GuildMember): boolean {
	if (MainConfig.adminUserIds.includes(member.id)) {
		return true;
	}

	const guildConfig = PrivatesConfig.guilds[member.guild.id];

	if (!guildConfig) {
		return false;
	}

	return guildConfig.adminUserIds.includes(member.id) || isMemberHaveRole(member, guildConfig.adminRoleIds);
}
