import { SlashCommandBuilder } from 'discord.js';
import srlLobbySession from '../lib/srlLobbySession.js';
import { buildSrlLobbyMessage } from '../lib/srlLobbyView.js';
import { startWatching } from '../lib/srlLobbyWatcher.js';
import { isLinked } from '../auth/tokenStore.js';

export const data = new SlashCommandBuilder()
  .setName('srl-lobby')
  .setDescription('Open an SRL racing lobby — race results and rankings track automatically while it\'s open');

export async function execute(interaction) {
  const guildId = interaction.guildId;
  const existing = srlLobbySession.get(guildId);

  if (existing) {
    return interaction.reply({
      content: 'An SRL lobby is already active in this server. Use `/srl-lobby-stop` to end it first.',
      ephemeral: true,
    });
  }

  const session = srlLobbySession.create(guildId, interaction.user.id, interaction.channelId);
  session.players.push({
    userId:   interaction.user.id,
    username: interaction.member?.displayName ?? interaction.user.username,
  });

  if (isLinked(interaction.user.id)) {
    try {
      await startWatching(guildId, interaction.user.id, interaction.channel);
      session.rankingsActive = true;
    } catch {
      session.rankingsActive = false;
    }
  }

  const msg = await interaction.reply({
    ...buildSrlLobbyMessage(session),
    fetchReply: true,
  });

  srlLobbySession.update(guildId, { lobbyMessageId: msg.id });
}
