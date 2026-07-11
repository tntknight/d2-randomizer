import { SlashCommandBuilder } from 'discord.js';
import { stopRaceWatching, isRaceWatching } from '../lib/raceWatcher.js';

export const data = new SlashCommandBuilder()
  .setName('srl-stop')
  .setDescription('Stop watching for Sparrow Racing results');

export async function execute(interaction) {
  if (!isRaceWatching(interaction.user.id)) {
    return interaction.reply({ content: "You're not in SRL watch mode.", ephemeral: true });
  }
  stopRaceWatching(interaction.user.id);
  await interaction.reply({ content: '✅ SRL watch mode stopped.', ephemeral: true });
}
