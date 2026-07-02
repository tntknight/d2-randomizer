import { EmbedBuilder } from 'discord.js';
import { getTokens } from '../auth/tokenStore.js';
import { getCharacterIds, getLatestPvpActivity, getPGCR } from './bungieActivity.js';
import { buildMatchData } from './comparator.js';
import { pickLoadout } from './loadoutPicker.js';
import { getIconUrl } from './bungieManifest.js';
import { buildDimSearch } from './dimSearch.js';
import sessionStore from './sessionStore.js';

const POLL_MS = 30_000; // check every 30 seconds

const MODE_NAMES = {
  5:  'PvP',
  10: 'Control',
  12: 'Team Deathmatch',
  15: 'Elimination',
  19: 'Iron Banner',
  37: 'Survival',
  38: 'Countdown',
  43: 'Breakthrough',
  48: 'Showdown',
  59: 'Momentum Control',
  84: 'Trials of Osiris',
};

const SLOT_COLORS = {
  kineticslot: 0x9ba3af,
  energy:      0x4a9eff,
  power:       0xc5a93e,
};

// userId → { channel, guildId, membershipType, membershipId, displayName, characterIds, lastInstanceId, interval }
const watchers = new Map();

export async function startWatching(userId, channel, guildId) {
  if (watchers.has(userId)) stopWatching(userId);

  const tokens = getTokens(userId);
  if (!tokens) throw new Error('no-link');

  const { membershipType, membershipId, displayName } = tokens;

  const characterIds = await getCharacterIds(membershipType, membershipId);
  if (!characterIds.length) throw new Error('no-characters');

  // Record the current latest match as a baseline so we only react to NEW matches
  let lastInstanceId = null;
  for (const charId of characterIds) {
    const act = await getLatestPvpActivity(membershipType, membershipId, charId);
    if (act) { lastInstanceId = act.activityDetails.instanceId; break; }
  }

  const state = {
    userId, channel, guildId,
    membershipType, membershipId, displayName,
    characterIds, lastInstanceId,
    interval: null,
  };

  state.interval = setInterval(
    () => poll(state).catch(e => console.error('[Watcher] poll error:', e)),
    POLL_MS,
  );

  watchers.set(userId, state);
}

export function stopWatching(userId) {
  const state = watchers.get(userId);
  if (!state) return false;
  clearInterval(state.interval);
  watchers.delete(userId);
  return true;
}

export function isWatching(userId) {
  return watchers.has(userId);
}

// ── Polling ───────────────────────────────────────────────────────────────────

async function poll(state) {
  for (const charId of state.characterIds) {
    const act = await getLatestPvpActivity(state.membershipType, state.membershipId, charId);
    if (!act) continue;

    const instanceId = act.activityDetails.instanceId;
    if (instanceId === state.lastInstanceId) break; // no new match yet

    state.lastInstanceId = instanceId;
    const pgcr = await getPGCR(instanceId);
    if (pgcr) await postMatchResult(pgcr, state);
    break;
  }
}

// ── Match result post ─────────────────────────────────────────────────────────

async function postMatchResult(pgcr, state) {
  const { channel, guildId, membershipId, displayName } = state;
  const mode    = MODE_NAMES[pgcr.activityDetails?.mode] ?? 'PvP';
  const entries = pgcr.entries ?? [];
  const teams   = pgcr.teams  ?? [];
  const isFFA   = teams.length === 0;

  const winningTeamId = teams.find(t => t.standing?.basic?.value === 0)?.teamId ?? null;
  const myEntry       = entries.find(e => e.player?.destinyUserInfo?.membershipId === membershipId);
  const userWon       = myEntry?.values?.standing?.basic?.value === 0;

  const scoreboardLines = buildScoreboard(entries, winningTeamId, isFFA, membershipId);

  const resultEmbed = new EmbedBuilder()
    .setColor(userWon ? 0x57f287 : 0xed4245)
    .setTitle(`${userWon ? '🏆 Victory' : '💀 Defeat'} — ${mode}`)
    .setDescription(scoreboardLines.join('\n'))
    .setTimestamp(new Date(pgcr.period));

  if (teams.length >= 2) {
    const scores = teams.map(t => t.score?.basic?.displayValue ?? '0').join(' – ');
    resultEmbed.setFooter({ text: `Score: ${scores}` });
  }

  const content = userWon
    ? `🎉 GG ${displayName}! You won!`
    : `Better luck next time, ${displayName}!`;

  await channel.send({ content, embeds: [resultEmbed] });
  await maybeRollLoadout(channel, guildId);
}

function buildScoreboard(entries, winningTeamId, isFFA, myMembershipId) {
  const lines = [];

  if (isFFA) {
    const sorted = [...entries].sort(
      (a, b) => (b.values?.score?.basic?.value ?? 0) - (a.values?.score?.basic?.value ?? 0)
    );
    lines.push('**── Final Standings ──**');
    for (const e of sorted) lines.push(formatEntry(e, myMembershipId));
    return lines;
  }

  // Group players by team
  const byTeam = new Map();
  for (const e of entries) {
    const teamId = e.values?.team?.basic?.value;
    if (!byTeam.has(teamId)) byTeam.set(teamId, []);
    byTeam.get(teamId).push(e);
  }
  for (const members of byTeam.values()) {
    members.sort((a, b) => (b.values?.score?.basic?.value ?? 0) - (a.values?.score?.basic?.value ?? 0));
  }

  // Winning team first
  const teamOrder = [...byTeam.keys()].sort((a, b) => {
    if (a === winningTeamId) return -1;
    if (b === winningTeamId) return 1;
    return 0;
  });

  for (const teamId of teamOrder) {
    lines.push(teamId === winningTeamId ? '**── Victory ──**' : '**── Defeat ──**');
    for (const e of byTeam.get(teamId)) lines.push(formatEntry(e, myMembershipId));
  }

  return lines;
}

function formatEntry(entry, myMembershipId) {
  const name    = entry.player?.destinyUserInfo?.displayName ?? 'Unknown';
  const kills   = Math.round(entry.values?.kills?.basic?.value   ?? 0);
  const deaths  = Math.round(entry.values?.deaths?.basic?.value  ?? 0);
  const assists = Math.round(entry.values?.assists?.basic?.value ?? 0);
  const kd      = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2);
  const isMe    = entry.player?.destinyUserInfo?.membershipId === myMembershipId;
  const line    = `${name}: ${kills}/${deaths}/${assists} (${kd} KD)`;
  return isMe ? `**→ ${line}**` : `  ${line}`;
}

// ── Loadout roll ──────────────────────────────────────────────────────────────

async function maybeRollLoadout(channel, guildId) {
  if (!guildId) return;
  const session = sessionStore.get(guildId);
  if (!session || session.files.length < 2) return;

  if (!session.matchData) session.matchData = buildMatchData(session.files);

  const picks = pickLoadout(session.matchData);
  session.lastLoadout = picks;
  sessionStore.touch(guildId);

  const icons = await Promise.all(picks.map(p => getIconUrl(p.pick?.hash ?? null)));

  const embeds = picks.map(({ slot, pick }, i) => {
    const embed = new EmbedBuilder()
      .setColor(pick?.exotic ? 0xc5a93e : SLOT_COLORS[slot.key] ?? 0x1a1d26)
      .setTitle(slot.label);

    if (pick) {
      embed.setDescription(`**${pick.name}**${pick.exotic ? '  ✦ EXOTIC' : ''}\n${pick.type}`);
      if (icons[i]) embed.setThumbnail(icons[i]);
    } else {
      embed.setDescription('_No matches in this slot_');
    }
    return embed;
  });

  const pickedWeapons = picks.map(p => p.pick).filter(Boolean);
  const dimSearch     = buildDimSearch(pickedWeapons);
  const content       = pickedWeapons.length
    ? `**Next match loadout — DIM Search:**\n\`\`\`\n${dimSearch}\n\`\`\``
    : '**Next match loadout:**';

  embeds[embeds.length - 1].setFooter({ text: 'Run /compare-loadout to reroll' });
  await channel.send({ content, embeds });
}
