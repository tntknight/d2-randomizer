import { SlashCommandBuilder } from 'discord.js';
import { stopRaidWatching, isRaidWatching } from '../lib/raidWatcher.js';

export const data = new SlashCommandBuilder()
  .setName('raid-stop')
  .setDescription('Stop watching for raid results');

export async function execute(interaction) {
  if (!isRaidWatching(interaction.user.id)) {
    return interaction.reply({ content: "You're not in raid watch mode.", ephemeral: true });
  }
  stopRaidWatching(interaction.user.id);
  await interaction.reply({ content: '✅ Raid watch stopped.', ephemeral: true });
}
