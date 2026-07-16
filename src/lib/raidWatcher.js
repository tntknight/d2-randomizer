import { EmbedBuilder } from 'discord.js';
import { getTokens } from '../auth/tokenStore.js';
import { getCharacterIds, getLatestActivity, getPGCR, getActivityName } from './bungieActivity.js';
import { getWeaponDef } from './bungieManifest.js';

const POLL_MS   = 30_000;
const RAID_MODE = 4;

// userId → watcher state
const watchers = new Map();

export async function startRaidWatching(userId, channel) {
  if (watchers.has(userId)) stopRaidWatching(userId);

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

  console.log(`[RaidWatcher] Started for ${displayName} — ${characterIds.length} characters`);

  const state = {
    userId, channel,
    membershipType, membershipId, displayName,
    characterIds, seenIds,
    pendingId: null,
    interval: null,
  };

  state.interval = setInterval(
    () => poll(state).catch(e => console.error('[RaidWatcher] poll error:', e)),
    POLL_MS,
  );

  watchers.set(userId, state);
}

export function stopRaidWatching(userId) {
  const state = watchers.get(userId);
  if (!state) return false;
  clearInterval(state.interval);
  watchers.delete(userId);
  return true;
}

export function isRaidWatching(userId) {
  return watchers.has(userId);
}

// ── Polling ───────────────────────────────────────────────────────────────────

async function poll(state) {
  if (state.pendingId) {
    const pgcr = await getPGCR(state.pendingId);
    if (pgcr) {
      state.seenIds.add(state.pendingId);
      state.pendingId = null;
      if (pgcr.activityDetails?.mode === RAID_MODE) await postRaidResult(pgcr, state);
    }
    return;
  }

  for (const charId of state.characterIds) {
    const act = await getLatestActivity(state.membershipType, state.membershipId, charId);
    if (!act) continue;

    const instanceId = act.activityDetails.instanceId;
    if (state.seenIds.has(instanceId)) continue;

    const mode = act.activityDetails.mode;
    console.log(`[RaidWatcher] New activity ${instanceId} mode=${mode}`);

    if (mode !== RAID_MODE) {
      state.seenIds.add(instanceId);
      continue;
    }

    const pgcr = await getPGCR(instanceId);
    if (!pgcr) {
      console.log(`[RaidWatcher] PGCR not ready for ${instanceId}, will retry`);
      state.pendingId = instanceId;
      return;
    }

    state.seenIds.add(instanceId);
    await postRaidResult(pgcr, state);
    return;
  }
}

// ── Raid result post ──────────────────────────────────────────────────────────

async function postRaidResult(pgcr, state) {
  const entries  = pgcr.entries ?? [];
  const raidName = await getActivityName(pgcr.activityDetails?.referenceId, 'Raid').catch(() => 'Raid');
  const duration = entries[0]?.values?.activityDurationSeconds?.basic?.displayValue ?? null;
  const cleared  = entries.some(e => e.values?.completed?.basic?.value === 1);

  // Sort players by kills descending
  const sorted = [...entries].sort((a, b) =>
    (b.values?.kills?.basic?.value ?? 0) - (a.values?.kills?.basic?.value ?? 0)
  );

  const headerEmbed = new EmbedBuilder()
    .setColor(cleared ? 0x2ecc71 : 0xed4245)
    .setTitle(cleared ? `🏰 ${raidName} — Cleared!` : `🏰 ${raidName} — Not Completed`)
    .setTimestamp(new Date(pgcr.period));
  if (duration) headerEmbed.setFooter({ text: `Duration: ${duration}` });

  const playerEmbeds = await Promise.all(sorted.map(async e => {
    const name      = e.player?.destinyUserInfo?.displayName ?? 'Unknown';
    const kills     = Math.round(e.values?.kills?.basic?.value   ?? 0);
    const deaths    = Math.round(e.values?.deaths?.basic?.value  ?? 0);
    const assists   = Math.round(e.values?.assists?.basic?.value ?? 0);
    const completed = e.values?.completed?.basic?.value === 1;
    const isMe      = e.player?.destinyUserInfo?.membershipId === state.membershipId;
    const kd        = (e.values?.killsDeathsRatio?.basic?.value ?? 0).toFixed(2);
    const status    = completed ? '✅' : '❌';
    const marker    = isMe ? ' ★' : '';

    const topWeapons = (e.extended?.weapons ?? [])
      .sort((a, b) => (b.values?.uniqueWeaponKills?.basic?.value ?? 0) - (a.values?.uniqueWeaponKills?.basic?.value ?? 0))
      .slice(0, 3);

    const weaponDefs = await Promise.all(
      topWeapons.map(w => getWeaponDef(w.referenceId).catch(() => null))
    );

    const fields = topWeapons.map((w, i) => ({
      name:   weaponDefs[i]?.name ?? 'Unknown Weapon',
      value:  `${w.values?.uniqueWeaponKills?.basic?.value ?? 0} kills`,
      inline: true,
    }));

    const embed = new EmbedBuilder()
      .setColor(completed ? 0x2ecc71 : 0xed4245)
      .setTitle(`${status} ${name}${marker}`)
      .setDescription(`${kills} / ${deaths} / ${assists}  •  ${kd} KD`);

    if (fields.length)            embed.addFields(...fields);
    if (weaponDefs[0]?.iconUrl)   embed.setThumbnail(weaponDefs[0].iconUrl);

    return embed;
  }));

  const content = cleared
    ? `Well done, ${state.displayName}! Raid cleared!`
    : `Raid ended, ${state.displayName}.`;

  await state.channel.send({ content, embeds: [headerEmbed, ...playerEmbeds] });
}
