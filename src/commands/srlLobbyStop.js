import { SlashCommandBuilder } from 'discord.js';
import srlLobbySession from '../lib/srlLobbySession.js';
import { stopWatching } from '../lib/srlLobbyWatcher.js';

export const data = new SlashCommandBuilder()
  .setName('srl-lobby-stop')
  .setDescription('End the active SRL lobby in this server');

export async function execute(interaction) {
  const guildId = interaction.guildId;
  const session = srlLobbySession.get(guildId);

  if (!session) {
    return interaction.reply({ content: 'No SRL lobby is active.', ephemeral: true });
  }
  if (session.hostId !== interaction.user.id) {
    return interaction.reply({ content: 'Only the host can end the lobby.', ephemeral: true });
  }

  stopWatching(guildId);
  srlLobbySession.clear(guildId);
  await interaction.reply({ content: '✅ SRL lobby ended.', ephemeral: true });
}
