import { EmbedBuilder } from 'discord.js';
import { getTokens } from '../auth/tokenStore.js';
import { getCharacterIds, getLatestActivity, getPGCR } from './bungieActivity.js';

const POLL_MS  = 30_000;
const SRL_MODE = 32;

// Medals for finish positions
const MEDALS = ['🥇', '🥈', '🥉'];

// userId → watcher state
const watchers = new Map();

export async function startRaceWatching(userId, channel) {
  if (watchers.has(userId)) stopRaceWatching(userId);

  const tokens = getTokens(userId);
  if (!tokens) throw new Error('no-link');

  const { membershipType, membershipId, displayName } = tokens;
  const characterIds = await getCharacterIds(membershipType, membershipId);
  if (!characterIds.length) throw new Error('no-characters');

  // Snapshot latest activity per character as baseline
  const seenIds = new Set();
  for (const charId of characterIds) {
    const act = await getLatestActivity(membershipType, membershipId, charId);
    if (act) seenIds.add(act.activityDetails.instanceId);
  }

  console.log(`[RaceWatcher] Started for ${displayName} — ${characterIds.length} characters`);

  const state = {
    userId, channel,
    membershipType, membershipId, displayName,
    characterIds, seenIds,
    pendingId: null,
    interval: null,
  };

  state.interval = setInterval(
    () => poll(state).catch(e => console.error('[RaceWatcher] poll error:', e)),
    POLL_MS,
  );

  watchers.set(userId, state);
}

export function stopRaceWatching(userId) {
  const state = watchers.get(userId);
  if (!state) return false;
  clearInterval(state.interval);
  watchers.delete(userId);
  return true;
}

export function isRaceWatching(userId) {
  return watchers.has(userId);
}

// ── Polling ───────────────────────────────────────────────────────────────────

async function poll(state) {
  // Retry a pending PGCR first
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
    console.log(`[RaceWatcher] New activity ${instanceId} mode=${mode}`);

    // Only care about SRL matches
    if (mode !== SRL_MODE) {
      state.seenIds.add(instanceId);
      continue;
    }

    const pgcr = await getPGCR(instanceId);
    if (!pgcr) {
      console.log(`[RaceWatcher] PGCR not ready for ${instanceId}, will retry`);
      state.pendingId = instanceId;
      return;
    }

    state.seenIds.add(instanceId);
    await postRaceResult(pgcr, state);
    return;
  }
}

// ── Race result post ──────────────────────────────────────────────────────────

async function postRaceResult(pgcr, state) {
  const entries = pgcr.entries ?? [];

  // Sort by score descending — standing field is unreliable for SRL private matches
  const sorted = [...entries].sort((a, b) =>
    (b.values?.score?.basic?.value ?? 0) - (a.values?.score?.basic?.value ?? 0)
  );

  const lines = sorted.map((entry, i) => {
    const name      = entry.player?.destinyUserInfo?.displayName ?? 'Unknown';
    const completed = (entry.values?.completed?.basic?.value ?? 1) === 1;
    const isMe      = entry.player?.destinyUserInfo?.membershipId === state.membershipId;

    const score  = entry.values?.score?.basic?.displayValue ?? null;
    const medal  = MEDALS[i] ?? `${i + 1}.`;
    const dnf    = completed ? '' : ' _(DNF)_';
    const stat   = score ? ` — ${score} pts` : '';
    const line   = `${medal} ${name}${stat}${dnf}`;
    return isMe ? `**${line}**` : line;
  });

  // Check if the watching player won (1st place)
  const myEntry  = entries.find(e => e.player?.destinyUserInfo?.membershipId === state.membershipId);
  const myFinish = sorted.findIndex(e => e.player?.destinyUserInfo?.membershipId === state.membershipId);
  const userWon  = myFinish === 0;

  const embed = new EmbedBuilder()
    .setColor(userWon ? 0xf0a30a : 0x9ba3af)
    .setTitle(userWon ? '🏁 Race Complete — 1st Place!' : `🏁 Race Complete — ${myFinish + 1}${ordinal(myFinish + 1)} Place`)
    .setDescription(lines.join('\n'))
    .setTimestamp(new Date(pgcr.period));

  const content = userWon
    ? `🏆 First place! Great racing, ${state.displayName}!`
    : `Race done, ${state.displayName}! Finished ${myFinish + 1}${ordinal(myFinish + 1)}.`;

  await state.channel.send({ content, embeds: [embed] });
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0];
}
