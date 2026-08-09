import { EmbedBuilder } from 'discord.js';
import { getTokens, isLinked } from '../auth/tokenStore.js';
import { getCharacterIds, getLatestActivity, getPGCR } from './bungieActivity.js';
import srlLobbySession from './srlLobbySession.js';
import { buildSrlLobbyMessage } from './srlLobbyView.js';

const POLL_MS   = 30_000;
const SRL_MODE  = 94; // "Sparrow Racing" — covers both the public playlist and private matches
const RANK_POINTS = [6, 5, 4, 3, 2, 1]; // 1st..6th place; matches the 6-player lobby cap
const MEDALS = ['🥇', '🥈', '🥉'];

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
    () => poll(state).catch(e => console.error('[SrlLobbyWatcher] poll error:', e)),
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
  const session = srlLobbySession.get(state.guildId);
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
        srlLobbySession.update(state.guildId, { rankingsActive: true });
      } catch {
        srlLobbySession.update(state.guildId, { rankingsActive: false });
      }
    } else {
      srlLobbySession.update(state.guildId, { rankingsActive: false });
    }
    return;
  }

  if (state.pendingId) {
    const pgcr = await getPGCR(state.pendingId);
    if (pgcr) {
      state.seenIds.add(state.pendingId);
      state.pendingId = null;
      if (pgcr.activityDetails?.mode === SRL_MODE) await postRaceResult(pgcr, state);
    }
    return;
  }

  for (const charId of state.characterIds) {
    const act = await getLatestActivity(state.membershipType, state.membershipId, charId);
    if (!act) continue;

    const instanceId = act.activityDetails.instanceId;
    if (state.seenIds.has(instanceId)) continue;

    const mode = act.activityDetails.mode;
    if (mode !== SRL_MODE) {
      state.seenIds.add(instanceId);
      continue;
    }

    const pgcr = await getPGCR(instanceId);
    if (!pgcr) {
      state.pendingId = instanceId;
      return;
    }

    state.seenIds.add(instanceId);
    await postRaceResult(pgcr, state);
    return;
  }
}

// ── Race result → rankings ─────────────────────────────────────────────────────

function msToRaceTime(ms) {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(1);
  return `${minutes}:${seconds.padStart(4, '0')}`;
}

async function postRaceResult(pgcr, state) {
  const session = srlLobbySession.get(state.guildId);
  if (!session) return;

  const entries = pgcr.entries ?? [];
  if (entries.length === 0) return;

  // Sort by score ascending — score is race time in ms, lower = faster = better finish
  const sorted = [...entries].sort((a, b) =>
    (a.values?.score?.basic?.value ?? Infinity) - (b.values?.score?.basic?.value ?? Infinity)
  );

  const byMembershipId = new Map();
  for (const p of session.players) {
    const tokens = getTokens(p.userId);
    if (tokens?.membershipId) byMembershipId.set(tokens.membershipId, p);
  }

  const rankings = { ...session.rankings };
  const lines = [];

  sorted.forEach((entry, i) => {
    const place        = i + 1;
    const name          = entry.player?.destinyUserInfo?.displayName ?? 'Unknown';
    const completed     = (entry.values?.completed?.basic?.value ?? 1) === 1;
    const scoreMs       = entry.values?.score?.basic?.value ?? null;
    const membershipId  = entry.player?.destinyUserInfo?.membershipId;
    const lobbyPlayer   = membershipId ? byMembershipId.get(membershipId) : null;

    const medal = MEDALS[i] ?? `${place}.`;
    const dnf   = completed ? '' : ' _(DNF)_';
    const stat  = scoreMs != null ? ` — ${msToRaceTime(scoreMs)}` : '';

    if (lobbyPlayer) {
      const points = RANK_POINTS[i] ?? 0;
      const prev = rankings[lobbyPlayer.userId] ?? { username: lobbyPlayer.username, points: 0, matches: 0 };
      rankings[lobbyPlayer.userId] = {
        username: lobbyPlayer.username,
        points:   prev.points + points,
        matches:  prev.matches + 1,
      };
      lines.push(`**${medal} ${name}${stat}${dnf}** (+${points})`);
    } else {
      lines.push(`${medal} ${name}${stat}${dnf}`);
    }
  });

  srlLobbySession.update(state.guildId, { rankings });

  const resultEmbed = new EmbedBuilder()
    .setColor(0xf0a30a)
    .setTitle('🏁 Race Result')
    .setDescription(lines.join('\n'))
    .setTimestamp(new Date(pgcr.period));

  await state.channel.send({ embeds: [resultEmbed] }).catch(() => {});
  await refreshLobbyMessage(state);
}

async function refreshLobbyMessage(state) {
  const session = srlLobbySession.get(state.guildId);
  if (!session || !session.lobbyMessageId) return;

  try {
    const channel  = await state.channel.client.channels.fetch(session.lobbyChannelId);
    const lobbyMsg = await channel.messages.fetch(session.lobbyMessageId);
    await lobbyMsg.edit(buildSrlLobbyMessage(session));
  } catch {
    // Lobby message is gone — nothing to refresh
  }
}
