import { SlashCommandBuilder } from 'discord.js';
import chaosSession from '../lib/chaosSession.js';
import { buildLobbyEmbed, buildLobbyRow } from '../lib/chaosButtonHandler.js';

export const data = new SlashCommandBuilder()
  .setName('chaos-start')
  .setDescription('Open a Chaos Raid lobby — up to 6 players can join before the host begins');

export async function execute(interaction) {
  const guildId = interaction.guildId;
  const existing = chaosSession.get(guildId);

  if (existing && existing.phase !== 'done') {
    return interaction.reply({
      content: `A chaos session is already active (phase: **${existing.phase}**). Use \`/chaos-begin\` to start it, or wait for it to end.`,
      ephemeral: true,
    });
  }

  const session = chaosSession.create(guildId, interaction.user.id, interaction.channelId);
  session.players.push({
    userId:           interaction.user.id,
    username:         interaction.user.username,
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
