import { SlashCommandBuilder } from 'discord.js';
import pvpRandomSession from '../lib/pvpRandomSession.js';
import { stopWatching } from '../lib/pvpRandomWatcher.js';

export const data = new SlashCommandBuilder()
  .setName('pvp-random-stop')
  .setDescription('End the active pvp-random lobby in this server');

export async function execute(interaction) {
  const guildId = interaction.guildId;
  const session = pvpRandomSession.get(guildId);

  if (!session) {
    return interaction.reply({ content: 'No pvp-random lobby is active.', ephemeral: true });
  }
  if (session.hostId !== interaction.user.id) {
    return interaction.reply({ content: 'Only the host can end the lobby.', ephemeral: true });
  }

  stopWatching(guildId);
  pvpRandomSession.clear(guildId);
  await interaction.reply({ content: '✅ pvp-random lobby ended.', ephemeral: true });
}
