import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export function buildSrlLobbyMessage(session) {
  const hostName   = session.players.find(p => p.userId === session.hostId)?.username ?? 'Unknown';
  const playerList = session.players.map(p => p.username).join('\n') || 'None yet';

  const embed = new EmbedBuilder()
    .setColor(0xf0a30a)
    .setTitle('🏎️ SRL Lobby')
    .setDescription(`Up to ${session.maxPlayers} players can join. When the host finishes a Sparrow Racing private match, results and rankings post automatically.`)
    .addFields(
      { name: 'Host', value: hostName, inline: true },
      { name: `Players (${session.players.length}/${session.maxPlayers})`, value: playerList, inline: true },
    );

  const rankingEntries = Object.entries(session.rankings ?? {}).sort((a, b) => b[1].points - a[1].points);
  if (rankingEntries.length > 0) {
    const medals = ['🥇', '🥈', '🥉'];
    const lines = rankingEntries.map(([, r], i) => `${medals[i] ?? `${i + 1}.`} ${r.username} — ${r.points} pts (${r.matches} race${r.matches === 1 ? '' : 's'})`);
    embed.addFields({ name: '🏆 Rankings', value: lines.join('\n') });
  } else if (session.rankingsActive === false) {
    embed.addFields({ name: '🏆 Rankings', value: "Off — host isn't linked. Run `/link-account` and restart the lobby to track race rankings." });
  }

  embed.setFooter({ text: 'Join / Leave anytime — races are tracked automatically while the lobby is open' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`srll:join:${session.guildId}`)
      .setLabel('Join')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(session.players.length >= session.maxPlayers),
    new ButtonBuilder()
      .setCustomId(`srll:leave:${session.guildId}`)
      .setLabel('Leave')
      .setStyle(ButtonStyle.Secondary),
  );

  return { embeds: [embed], components: [row] };
}
