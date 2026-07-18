import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } from 'discord.js';
import { fileURLToPath } from 'url';
import path from 'path';
import { SLOTS } from './loadoutPicker.js';
import { buildDimSearch } from './dimSearch.js';
import { MAPS } from '../commands/randomMap.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAPS_DIR  = path.join(__dirname, '..', 'assets', 'maps');

const SLOT_COLORS = { kineticslot: 0x9ba3af, energy: 0x4a9eff, power: 0xc5a93e };

export function buildPvpMessage(session, extra = {}) {
  const embeds = [];
  const files  = [];

  const hostName   = session.players.find(p => p.userId === session.hostId)?.username ?? 'Unknown';
  const playerList = session.players.map(p => p.username).join('\n') || 'None yet';

  const lobbyEmbed = new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle('PvP Random Lobby')
    .setDescription(`Up to ${session.maxPlayers} players can join. Host rolls a random loadout everyone has in common.`)
    .addFields(
      { name: 'Host', value: hostName, inline: true },
      { name: `Players (${session.players.length}/${session.maxPlayers})`, value: playerList, inline: true },
    );

  if (session.lastStats) {
    const { commonCount, exoticCount, perSlotCounts } = session.lastStats;
    const perSlotText = SLOTS
      .map(s => `${s.label}: ${perSlotCounts[s.key] ?? 0}`)
      .join(' · ');
    lobbyEmbed.addFields({
      name: 'In Common',
      value: `${commonCount} weapons (${exoticCount} exotic) — ${perSlotText}\nExcluded so far: ${session.excludedHashes.length}`,
    });
  }

  if (session.lastMap) {
    lobbyEmbed.addFields({ name: 'Current Map', value: session.lastMap.name });
  }

  const rankingEntries = Object.entries(session.rankings ?? {}).sort((a, b) => b[1].points - a[1].points);
  if (rankingEntries.length > 0) {
    const medals = ['🥇', '🥈', '🥉'];
    const lines = rankingEntries.map(([, r], i) => `${medals[i] ?? `${i + 1}.`} ${r.username} — ${r.points} pts (${r.matches} match${r.matches === 1 ? '' : 'es'})`);
    lobbyEmbed.addFields({ name: '🏆 Rankings', value: lines.join('\n') });
  } else if (session.rankingsActive === false) {
    lobbyEmbed.addFields({ name: '🏆 Rankings', value: "Off — host isn't linked. Run `/link-account` and restart the lobby to track match rankings." });
  }

  if (extra.note) {
    lobbyEmbed.addFields({ name: 'Note', value: extra.note });
  }

  lobbyEmbed.setFooter({ text: 'Join / Leave anytime — only the host can roll' });
  embeds.push(lobbyEmbed);

  if (session.lastLoadout) {
    for (const { slot, pick } of session.lastLoadout) {
      const embed = new EmbedBuilder()
        .setColor(pick?.exotic ? 0xc5a93e : SLOT_COLORS[slot.key] ?? 0x1a1d26)
        .setTitle(slot.label);
      if (pick) {
        embed.setDescription(`**${pick.name}**${pick.exotic ? '  ✦ EXOTIC' : ''}\n${pick.type ?? ''}`);
        if (pick.iconUrl) embed.setThumbnail(pick.iconUrl);
      } else {
        embed.setDescription('_No weapons left in this slot_');
      }
      embeds.push(embed);
    }
  }

  if (session.lastMap?.image) {
    const file = new AttachmentBuilder(path.join(MAPS_DIR, session.lastMap.image));
    files.push(file);
    embeds.push(
      new EmbedBuilder()
        .setColor(0x4a9eff)
        .setTitle('🗺️ Map')
        .setDescription(`**${session.lastMap.name}**`)
        .setImage(`attachment://${session.lastMap.image}`),
    );
  }

  const pickedWeapons = session.lastLoadout?.map(p => p.pick).filter(Boolean) ?? [];
  const content = pickedWeapons.length
    ? `**DIM Search:**\n\`\`\`\n${buildDimSearch(pickedWeapons)}\n\`\`\``
    : null;

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`pvpr:join:${session.guildId}`)
      .setLabel('Join')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(session.players.length >= session.maxPlayers),
    new ButtonBuilder()
      .setCustomId(`pvpr:leave:${session.guildId}`)
      .setLabel('Leave')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`pvpr:roll-loadout:${session.guildId}`)
      .setLabel('Roll Loadout')
      .setStyle(ButtonStyle.Success)
      .setDisabled(session.players.length < 2),
    new ButtonBuilder()
      .setCustomId(`pvpr:roll-map:${session.guildId}`)
      .setLabel('Roll Map')
      .setStyle(ButtonStyle.Primary),
  );

  return { embeds, components: [row], files, content };
}
