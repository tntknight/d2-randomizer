import { EmbedBuilder } from 'discord.js';
import { getTokens, isLinked } from '../auth/tokenStore.js';
import { getCharacterIds, getLatestActivity, getPGCR } from './bungieActivity.js';
import pvpRandomSession from './pvpRandomSession.js';
import { buildPvpMessage } from './pvpRandomView.js';

const POLL_MS = 30_000;
const RANK_POINTS = [6, 5, 4, 3, 2, 1]; // 1st..6th place; 7th+ scores 0

const MODE_NAMES = {
  5: 'PvP', 10: 'Control', 12: 'Team Deathmatch', 15: 'Elimination',
  19: 'Iron Banner', 37: 'Survival', 38: 'Countdown', 43: 'Breakthrough',
  48: 'Showdown', 59: 'Momentum Control', 84: 'Trials of Osiris',
  32: 'Private Match', 33: 'Private Match — Clash', 34: 'Private Match — Control',
  36: 'Private Match — Supremacy', 39: 'Private Match — Showdown',
  40: 'Private Match — Lockdown', 41: 'Private Match — Scorched',
  42: 'Private Match — Scorched Team', 44: 'Private Match — Doubles',
  45: 'Private Match — Zero Hour',
};

// guildId → { guildId, hostId, channel, membershipType, membershipId, characterIds, seenIds, pendingId, interval }
const watchers = new Map();

export async function startWatching(guildId, hostId, channel) {
  if (watchers.has(guildId)) stopWatching(guildId);

  const tokens = getTokens(hostId);
  if (!tokens) throw new Error('no-link');

  const { membershipType, membershipId } = tokens;
  const characterIds = await getCharacterIds(membershipType, membershipId);
  if (!characterIds.length) throw new Error('no-characters');

  const seenIds = new Set();
  for (const charId of characterIds) {
    const act = await getLatestActivity(membershipType, membershipId, charId);
    if (act) seenIds.add(act.activityDetails.instanceId);
  }

  const state = {
    guildId, hostId, channel,
    membershipType, membershipId, characterIds,
    seenIds, pendingId: null, interval: null,
  };

  state.interval = setInterval(
    () => poll(state).catch(e => console.error('[PvpRandomWatcher] poll error:', e)),
    POLL_MS,
  );

  watchers.set(guildId, state);
}

export function stopWatching(guildId) {
  const state = watchers.get(guildId);
  if (!state) return false;
  clearInterval(state.interval);
  watchers.delete(guildId);
  return true;
}

export function isWatching(guildId) {
  return watchers.has(guildId);
}

// ── Polling ───────────────────────────────────────────────────────────────────

async function poll(state) {
  const session = pvpRandomSession.get(state.guildId);
  if (!session) {
    stopWatching(state.guildId);
    return;
  }

  // Host changed since we started watching — restart under the new host
  if (session.hostId !== state.hostId) {
    stopWatching(state.guildId);
    if (isLinked(session.hostId)) {
      try {
        await startWatching(session.guildId, session.hostId, state.channel);
        pvpRandomSession.update(state.guildId, { rankingsActive: true });
      } catch {
        pvpRandomSession.update(state.guildId, { rankingsActive: false });
      }
    } else {
      pvpRandomSession.update(state.guildId, { rankingsActive: false });
    }
    return;
  }

  if (state.pendingId) {
    const pgcr = await getPGCR(state.pendingId);
    if (pgcr) {
      state.seenIds.add(state.pendingId);
      state.pendingId = null;
      await postMatchResult(pgcr, state);
    }
    return;
  }

  for (const charId of state.characterIds) {
    const act = await getLatestActivity(state.membershipType, state.membershipId, charId);
    if (!act) continue;

    const instanceId = act.activityDetails.instanceId;
    if (state.seenIds.has(instanceId)) continue;

    const pgcr = await getPGCR(instanceId);
    if (!pgcr) {
      state.pendingId = instanceId;
      return;
    }

    state.seenIds.add(instanceId);
    await postMatchResult(pgcr, state);
    return;
  }
}

// ── Match result → rankings ─────────────────────────────────────────────────────

async function postMatchResult(pgcr, state) {
  const session = pvpRandomSession.get(state.guildId);
  if (!session) return;

  const teams = pgcr.teams ?? [];
  if (teams.length === 0 && !MODE_NAMES[pgcr.activityDetails?.mode]) return; // not PvP

  const mode = MODE_NAMES[pgcr.activityDetails?.mode] ?? 'PvP';
  const entries = pgcr.entries ?? [];

  const byMembershipId = new Map();
  for (const p of session.players) {
    const tokens = getTokens(p.userId);
    if (tokens?.membershipId) byMembershipId.set(tokens.membershipId, p);
  }

  const ranked = [...entries].sort(
    (a, b) => (b.values?.score?.basic?.value ?? 0) - (a.values?.score?.basic?.value ?? 0)
  );

  const rankings = { ...session.rankings };
  const lines = [];

  ranked.forEach((entry, i) => {
    const rank         = i + 1;
    const name          = entry.player?.destinyUserInfo?.displayName ?? 'Unknown';
    const score         = Math.round(entry.values?.score?.basic?.value ?? 0);
    const membershipId  = entry.player?.destinyUserInfo?.membershipId;
    const lobbyPlayer   = membershipId ? byMembershipId.get(membershipId) : null;

    if (lobbyPlayer) {
      const points = RANK_POINTS[rank - 1] ?? 0;
      const prev = rankings[lobbyPlayer.userId] ?? { username: lobbyPlayer.username, points: 0, matches: 0 };
      rankings[lobbyPlayer.userId] = {
        username: lobbyPlayer.username,
        points:   prev.points + points,
        matches:  prev.matches + 1,
      };
      lines.push(`**${rank}. ${name}** — ${score} pts (+${points})`);
    } else {
      lines.push(`${rank}. ${name} — ${score} pts`);
    }
  });

  pvpRandomSession.update(state.guildId, { rankings });

  const resultEmbed = new EmbedBuilder()
    .setColor(0xf1c40f)
    .setTitle(`Match Result — ${mode}`)
    .setDescription(lines.join('\n') || 'No scoring data for this match.')
    .setTimestamp(new Date(pgcr.period));

  await state.channel.send({ embeds: [resultEmbed] }).catch(() => {});
  await refreshLobbyMessage(state);
}

async function refreshLobbyMessage(state) {
  const session = pvpRandomSession.get(state.guildId);
  if (!session || !session.lobbyMessageId) return;

  try {
    const channel  = await state.channel.client.channels.fetch(session.lobbyChannelId);
    const lobbyMsg = await channel.messages.fetch(session.lobbyMessageId);
    await lobbyMsg.edit(buildPvpMessage(session));
  } catch {
    // Lobby message is gone — nothing to refresh
  }
}
