import { EmbedBuilder } from 'discord.js';
import srlLobbySession from './srlLobbySession.js';
import { buildSrlLobbyMessage } from './srlLobbyView.js';
import { stopWatching } from './srlLobbyWatcher.js';

export async function handleSrlLobbyButton(interaction) {
  const parts = interaction.customId.split(':');
  const action = parts[1];
  const guildId = parts[2];

  switch (action) {
    case 'join':  return handleJoin(interaction, guildId);
    case 'leave': return handleLeave(interaction, guildId);
    default:
      await interaction.reply({ content: 'Unknown srl-lobby action.', ephemeral: true });
  }
}

async function handleJoin(interaction, guildId) {
  const session = srlLobbySession.get(guildId);
  if (!session) return interaction.reply({ content: 'This lobby has expired.', ephemeral: true });
  if (session.players.some(p => p.userId === interaction.user.id)) {
    return interaction.reply({ content: "You're already in the lobby!", ephemeral: true });
  }
  if (session.players.length >= session.maxPlayers) {
    return interaction.reply({ content: `The lobby is full (${session.maxPlayers}/${session.maxPlayers}).`, ephemeral: true });
  }

  // Synchronous push before any await to prevent race conditions
  session.players.push({ userId: interaction.user.id, username: interaction.member?.displayName ?? interaction.user.username });
  srlLobbySession.update(guildId, {});

  await interaction.update(buildSrlLobbyMessage(session));
}

async function handleLeave(interaction, guildId) {
  const session = srlLobbySession.get(guildId);
  if (!session) return interaction.reply({ content: 'This lobby has expired.', ephemeral: true });
  if (!session.players.some(p => p.userId === interaction.user.id)) {
    return interaction.reply({ content: "You're not in this lobby.", ephemeral: true });
  }

  session.players = session.players.filter(p => p.userId !== interaction.user.id);

  if (session.players.length === 0) {
    stopWatching(guildId);
    srlLobbySession.clear(guildId);
    const doneEmbed = new EmbedBuilder()
      .setColor(0x95a5a6)
      .setTitle('Lobby Closed')
      .setDescription('Everyone left. Run `/srl-lobby` to start a new one.');
    return interaction.update({ embeds: [doneEmbed], components: [] });
  }

  if (session.hostId === interaction.user.id) {
    session.hostId = session.players[0].userId;
  }
  srlLobbySession.update(guildId, {});

  await interaction.update(buildSrlLobbyMessage(session));
}
