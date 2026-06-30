import { SlashCommandBuilder } from 'discord.js';
import sessionStore from '../lib/sessionStore.js';

export const data = new SlashCommandBuilder()
  .setName('compare-clear')
  .setDescription('Clear all files and results for this server');

export async function execute(interaction) {
  if (!interaction.guildId) {
    return interaction.reply({ content: 'This command only works in a server.', ephemeral: true });
  }

  const had = sessionStore.get(interaction.guildId);
  sessionStore.clear(interaction.guildId);

  await interaction.reply({
    content: had
      ? 'Server pool cleared. Use `/compare-add` to start fresh.'
      : 'No active session for this server.',
    ephemeral: true,
  });
}
