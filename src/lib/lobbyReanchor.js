import guidedSession from './guidedSession.js';
import chaosSession from './chaosSession.js';
import pvpRandomSession from './pvpRandomSession.js';
import srlLobbySession from './srlLobbySession.js';

const REANCHOR_DELAY_MS = 4000;
const RESCHEDULE_DELAY_MS = 2000;
const RECENT_ACTIVITY_GUARD_MS = 1500;

const STORES = [
  { key: 'guided', store: guidedSession },
  { key: 'chaos',  store: chaosSession },
  { key: 'pvpr',   store: pvpRandomSession },
  { key: 'srll',   store: srlLobbySession },
];

const timers = new Map(); // "type:guildId" -> Timeout

let client = null;

export function initLobbyReanchor(discordClient) {
  client = discordClient;
}

// Called on every messageCreate — reschedules a reanchor for any lobby whose
// channel just received a message that isn't the lobby message itself.
export function handleLobbyChannelActivity(message) {
  if (!message.guildId) return;

  for (const { key, store } of STORES) {
    const session = store.get(message.guildId);
    if (!session || !session.lobbyMessageId || session.lobbyChannelId !== message.channelId) continue;
    if (message.id === session.lobbyMessageId) continue; // our own repost landing

    scheduleReanchor(key, message.guildId, store, REANCHOR_DELAY_MS);
  }
}

function scheduleReanchor(key, guildId, store, delayMs) {
  const timerKey = `${key}:${guildId}`;
  clearTimeout(timers.get(timerKey));
  timers.set(timerKey, setTimeout(() => {
    timers.delete(timerKey);
    reanchor(key, guildId, store).catch(err => console.error('[lobbyReanchor] reanchor failed:', err));
  }, delayMs));
}

async function reanchor(key, guildId, store) {
  const session = store.get(guildId);
  if (!session?.lobbyMessageId || !session.lobbyChannelId) return;

  // A button interaction may be mid-flight against the current message —
  // don't pull it out from under an in-progress update.
  if (Date.now() - session.lastActivity < RECENT_ACTIVITY_GUARD_MS) {
    scheduleReanchor(key, guildId, store, RESCHEDULE_DELAY_MS);
    return;
  }

  try {
    const channel = await client.channels.fetch(session.lobbyChannelId);
    const oldMsg  = await channel.messages.fetch(session.lobbyMessageId);

    const latest = (await channel.messages.fetch({ limit: 1 })).first();
    if (latest?.id === oldMsg.id) return; // already at the bottom

    const payload = {
      embeds:     oldMsg.embeds,
      components: oldMsg.components,
      files:      [...oldMsg.attachments.values()],
    };
    if (oldMsg.content) payload.content = oldMsg.content;

    // Send the repost first so any attachment CDN URLs are still live, then
    // delete the old message — the reverse order would risk expired URLs.
    const newMsg = await channel.send(payload);
    store.update(guildId, { lobbyMessageId: newMsg.id, lobbyChannelId: newMsg.channelId });
    await oldMsg.delete().catch(() => {});
  } catch {
    // Channel or message is gone — nothing to reanchor.
  }
}
