import { SlashCommandBuilder } from 'discord.js';
import chaosSession from '../lib/chaosSession.js';
import { buildLobbyEmbed, buildLobbyRow } from '../lib/chaosButtonHandler.js';

export const data = new SlashCommandBuilder()
  .setName('dungeon-start')
  .setDescription('Open a Chaos Dungeon lobby — up to 3 players can join before the host begins');

export async function execute(interaction) {
  const guildId = interaction.guildId;
  const existing = chaosSession.get(guildId);

  if (existing && existing.phase !== 'done') {
    return interaction.reply({
      content: `A session is already active (phase: **${existing.phase}**). Wait for it to end or finish it first.`,
      ephemeral: true,
    });
  }

  const session = chaosSession.create(guildId, interaction.user.id, interaction.channelId, 'dungeon');
  session.players.push({
    userId:           interaction.user.id,
    username:         interaction.member?.displayName ?? interaction.user.username,
    wantsRandomClass: null,
    assignedClass:    null,
  });

  const msg = await interaction.reply({
    embeds: [buildLobbyEmbed(session)],
    components: [buildLobbyRow(guildId)],
    fetchReply: true,
  });

  chaosSession.update(guildId, { lobbyMessageId: msg.id });
}
