import { EmbedBuilder } from 'discord.js';
import pvpRandomSession from './pvpRandomSession.js';
import { fetchWeapons } from './bungieVault.js';
import { buildMatchData } from './comparator.js';
import { pickLoadout, SLOTS } from './loadoutPicker.js';
import { getWeaponDef } from './bungieManifest.js';
import { MAPS } from '../commands/randomMap.js';
import { buildPvpMessage } from './pvpRandomView.js';
import { stopWatching } from './pvpRandomWatcher.js';

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
    stopWatching(guildId);
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

  // Discord won't let a bot edit a message's DIM-search content reliably, so
  // delete the old lobby message and repost a fresh one instead of editing.
  await interaction.message.delete().catch(() => {});
  const channel = await interaction.client.channels.fetch(interaction.channelId);
  const newMsg = await channel.send(buildPvpMessage(session));
  pvpRandomSession.update(guildId, { lobbyMessageId: newMsg.id, lobbyChannelId: newMsg.channelId });
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
