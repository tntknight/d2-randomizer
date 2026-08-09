import { SlashCommandBuilder } from 'discord.js';
import srlLobbySession from '../lib/srlLobbySession.js';
import { buildSrlLobbyMessage } from '../lib/srlLobbyView.js';

export const data = new SlashCommandBuilder()
  .setName('srl-lobby-kick')
  .setDescription('Remove a player from the SRL lobby (host only)')
  .addUserOption(o => o.setName('player').setDescription('Player to remove').setRequired(true));

export async function execute(interaction) {
  const guildId = interaction.guildId;
  const session = srlLobbySession.get(guildId);

  if (!session) {
    return interaction.reply({ content: 'No active SRL lobby. Run `/srl-lobby` first.', ephemeral: true });
  }
  if (session.hostId !== interaction.user.id) {
    return interaction.reply({ content: 'Only the host can kick players.', ephemeral: true });
  }

  const target = interaction.options.getUser('player');
  if (target.id === session.hostId) {
    return interaction.reply({ content: "You can't kick yourself — use `/srl-lobby-stop` to end the lobby instead.", ephemeral: true });
  }

  const wasInLobby = session.players.some(p => p.userId === target.id);
  if (!wasInLobby) {
    return interaction.reply({ content: `${target.username} isn't in the lobby.`, ephemeral: true });
  }

  session.players = session.players.filter(p => p.userId !== target.id);
  srlLobbySession.update(guildId, {});

  // Try to edit the original lobby message; fall back to a new reply if it's gone
  try {
    const channel = await interaction.client.channels.fetch(session.lobbyChannelId);
    const lobbyMsg = await channel.messages.fetch(session.lobbyMessageId);
    await lobbyMsg.edit(buildSrlLobbyMessage(session));
    await interaction.reply({ content: `✅ Removed ${target.username} from the lobby.`, ephemeral: true });
  } catch {
    await interaction.reply({ content: `✅ Removed ${target.username} from the lobby.`, ephemeral: true });
  }
}
