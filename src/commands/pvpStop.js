import { SlashCommandBuilder } from 'discord.js';
import { stopWatching, isWatching } from '../lib/matchWatcher.js';

export const data = new SlashCommandBuilder()
  .setName('pvp-stop')
  .setDescription('Stop watching for your PvP match results');

export async function execute(interaction) {
  if (!isWatching(interaction.user.id)) {
    return interaction.reply({ content: "You're not in watch mode.", ephemeral: true });
  }
  stopWatching(interaction.user.id);
  await interaction.reply({ content: '✅ Watch mode stopped.', ephemeral: true });
}
