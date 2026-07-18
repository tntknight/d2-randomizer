import { SlashCommandBuilder } from 'discord.js';
import pvpRandomSession from '../lib/pvpRandomSession.js';
import { buildPvpMessage } from '../lib/pvpRandomView.js';
import { startWatching } from '../lib/pvpRandomWatcher.js';
import { isLinked } from '../auth/tokenStore.js';

export const data = new SlashCommandBuilder()
  .setName('pvp-random')
  .setDescription('Open a PvP random loadout lobby — up to 12 players can join before the host rolls');

export async function execute(interaction) {
  const guildId = interaction.guildId;
  const existing = pvpRandomSession.get(guildId);

  if (existing) {
    return interaction.reply({
      content: 'A pvp-random lobby is already active in this server. Use `/pvp-random-stop` to end it first.',
      ephemeral: true,
    });
  }

  const session = pvpRandomSession.create(guildId, interaction.user.id, interaction.channelId);
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
    ...buildPvpMessage(session),
    fetchReply: true,
  });

  pvpRandomSession.update(guildId, { lobbyMessageId: msg.id });
}
