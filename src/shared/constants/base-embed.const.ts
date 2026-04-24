import { MainConfig } from '@config/main.config.js';
import { EmbedBuilder } from 'discord.js';

export const baseEmbed = () => new EmbedBuilder().setColor(MainConfig.color);
