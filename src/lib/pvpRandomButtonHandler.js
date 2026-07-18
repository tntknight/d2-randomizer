import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } from 'discord.js';
import { fileURLToPath } from 'url';
import path from 'path';
import pvpRandomSession from './pvpRandomSession.js';
import { fetchWeapons } from './bungieVault.js';
import { buildMatchData } from './comparator.js';
import { pickLoadout, SLOTS } from './loadoutPicker.js';
import { buildDimSearch } from './dimSearch.js';
import { getWeaponDef } from './bungieManifest.js';
import { MAPS } from '../commands/randomMap.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAPS_DIR  = path.join(__dirname, '..', 'assets', 'maps');

const SLOT_COLORS = { kineticslot: 0x9ba3af, energy: 0x4a9eff, power: 0xc5a93e };

const LINK_ERROR_MSG = {
  'no-link':       'Bungie account not linked — run `/link-account` to connect.',
  'refresh-failed': 'Bungie session expired — run `/link-account` to re-link.',
};

export async function handlePvpRandomButton(interaction) {
  const parts = interaction.customId.split(':');
  const action = parts[1];
  const guildId = parts[2];

  switch (action) {
    case 'join':         return handleJoin(interaction, guildId);
    case 'leave':         return handleLeave(interaction, guildId);
    case 'roll-loadout':  return handleRollLoadout(interaction, guildId);
    case 'roll-map':      return handleRollMap(interaction, guildId);
    default:
      await interaction.reply({ content: 'Unknown pvp-random action.', ephemeral: true });
  }
}

// ── Shared render ────────────────────────────────────────────────────────────

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

// ── Handlers ─────────────────────────────────────────────────────────────────

async function handleJoin(interaction, guildId) {
  const session = pvpRandomSession.get(guildId);
  if (!session) return interaction.reply({ content: 'This lobby has expired.', ephemeral: true });
  if (session.players.some(p => p.userId === interaction.user.id)) {
    return interaction.reply({ content: "You're already in the lobby!", ephemeral: true });
  }
  if (session.players.length >= session.maxPlayers) {
    return interaction.reply({ content: `The lobby is full (${session.maxPlayers}/${session.maxPlayers}).`, ephemeral: true });
  }

  // Synchronous push before any await to prevent race conditions
  session.players.push({ userId: interaction.user.id, username: interaction.member?.displayName ?? interaction.user.username });
  pvpRandomSession.update(guildId, {});

  await interaction.update(buildPvpMessage(session));
}

async function handleLeave(interaction, guildId) {
  const session = pvpRandomSession.get(guildId);
  if (!session) return interaction.reply({ content: 'This lobby has expired.', ephemeral: true });
  if (!session.players.some(p => p.userId === interaction.user.id)) {
    return interaction.reply({ content: "You're not in this lobby.", ephemeral: true });
  }

  session.players = session.players.filter(p => p.userId !== interaction.user.id);

  if (session.players.length === 0) {
    pvpRandomSession.clear(guildId);
    const doneEmbed = new EmbedBuilder()
      .setColor(0x95a5a6)
      .setTitle('Lobby Closed')
      .setDescription('Everyone left. Run `/pvp-random` to start a new one.');
    return interaction.update({ embeds: [doneEmbed], components: [], files: [] });
  }

  if (session.hostId === interaction.user.id) {
    session.hostId = session.players[0].userId;
  }
  pvpRandomSession.update(guildId, {});

  await interaction.update(buildPvpMessage(session));
}

async function handleRollLoadout(interaction, guildId) {
  const session = pvpRandomSession.get(guildId);
  if (!session) return interaction.reply({ content: 'This lobby has expired.', ephemeral: true });
  if (session.hostId !== interaction.user.id) {
    return interaction.reply({ content: 'Only the host can roll a loadout.', ephemeral: true });
  }
  if (session.players.length < 2) {
    return interaction.reply({ content: 'Need at least 2 players to roll a common loadout.', ephemeral: true });
  }

  await interaction.deferUpdate();

  const results = await Promise.all(session.players.map(async p => {
    try {
      const { weapons } = await fetchWeapons(p.userId);
      return { ok: true, username: p.username, weapons };
    } catch (err) {
      return { ok: false, username: p.username, reason: err.message };
    }
  }));

  const failed = results.filter(r => !r.ok);
  if (failed.length > 0) {
    const note = failed
      .map(f => `${f.username}: ${LINK_ERROR_MSG[f.reason] ?? 'Could not fetch vault.'}`)
      .join('\n');
    return interaction.editReply(buildPvpMessage(session, { note }));
  }

  const loadedFiles = results.map(r => ({ filename: r.username, weapons: r.weapons }));
  const matchData = buildMatchData(loadedFiles);

  const excludedSet = new Set(session.excludedHashes);
  const available = matchData.filter(w => !excludedSet.has(String(w.hash)));

  const rawPicks = pickLoadout(available);
  const defs = await Promise.all(rawPicks.map(({ pick }) => getWeaponDef(pick?.hash ?? null)));
  const picks = rawPicks.map(({ slot, pick }, i) => ({
    slot,
    pick: pick ? { ...pick, iconUrl: defs[i]?.iconUrl ?? null, type: defs[i]?.type ?? pick.type } : null,
  }));

  for (const { pick } of picks) {
    if (pick) excludedSet.add(String(pick.hash));
  }

  const perSlotCounts = {};
  for (const { key } of SLOTS) {
    perSlotCounts[key] = matchData.filter(w => w.category === key).length;
  }
  const lastStats = {
    commonCount: matchData.length,
    exoticCount: matchData.filter(w => w.exotic).length,
    perSlotCounts,
  };

  pvpRandomSession.update(guildId, {
    excludedHashes: [...excludedSet],
    lastLoadout: picks,
    lastStats,
  });

  await interaction.editReply(buildPvpMessage(session));
}

async function handleRollMap(interaction, guildId) {
  const session = pvpRandomSession.get(guildId);
  if (!session) return interaction.reply({ content: 'This lobby has expired.', ephemeral: true });
  if (session.hostId !== interaction.user.id) {
    return interaction.reply({ content: 'Only the host can roll a map.', ephemeral: true });
  }

  const map = MAPS[Math.floor(Math.random() * MAPS.length)];
  pvpRandomSession.update(guildId, { lastMap: map });

  await interaction.update(buildPvpMessage(session));
}
