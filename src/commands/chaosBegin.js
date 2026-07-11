import { SlashCommandBuilder } from 'discord.js';
import chaosSession from '../lib/chaosSession.js';
import { buildClassOptInEmbed, buildClassOptInRow } from '../lib/chaosButtonHandler.js';

export const data = new SlashCommandBuilder()
  .setName('chaos-begin')
  .setDescription('Close the lobby and begin the Chaos Raid (host only)');

export async function execute(interaction) {
  const guildId = interaction.guildId;
  const session = chaosSession.get(guildId);

  if (!session) {
    return interaction.reply({ content: 'No active chaos lobby. Run `/chaos-start` first.', ephemeral: true });
  }
  if (session.phase !== 'lobby') {
    return interaction.reply({ content: `The session is already past the lobby phase (current: **${session.phase}**).`, ephemeral: true });
  }
  if (session.hostId !== interaction.user.id) {
    return interaction.reply({ content: 'Only the host can begin the raid.', ephemeral: true });
  }
  if (session.players.length < 2) {
    return interaction.reply({ content: 'Need at least 2 players to begin. Wait for someone to join!', ephemeral: true });
  }

  chaosSession.update(guildId, { phase: 'class-opt-in', classOptInPending: session.players.length });

  // Try to edit the original lobby message; fall back to a new reply if it's gone
  try {
    const channel = await interaction.client.channels.fetch(session.lobbyChannelId);
    const lobbyMsg = await channel.messages.fetch(session.lobbyMessageId);
    await lobbyMsg.edit({ embeds: [buildClassOptInEmbed(session)], components: [buildClassOptInRow(guildId)] });
    await interaction.reply({ content: 'Lobby closed — class opt-in is now open!', ephemeral: true });
  } catch {
    await interaction.reply({
      embeds: [buildClassOptInEmbed(session)],
      components: [buildClassOptInRow(guildId)],
    });
  }
}
