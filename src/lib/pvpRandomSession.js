const TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

const sessions = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [guildId, session] of sessions) {
    if (now - session.lastActivity > TTL_MS) {
      sessions.delete(guildId);
    }
  }
}, 10 * 60 * 1000);

function create(guildId, hostId, channelId) {
  const session = {
    guildId,
    hostId,
    lobbyMessageId: null,
    lobbyChannelId: channelId,
    maxPlayers:     12,
    players:        [],
    excludedHashes: [],
    lastLoadout:    null,
    lastStats:      null,
    lastMap:        null,
    lastActivity:   Date.now(),
  };
  sessions.set(guildId, session);
  return session;
}

function get(guildId) {
  return sessions.get(guildId) ?? null;
}

function update(guildId, patch) {
  const session = sessions.get(guildId);
  if (!session) return null;
  Object.assign(session, patch, { lastActivity: Date.now() });
  return session;
}

function clear(guildId) {
  sessions.delete(guildId);
}

export default { create, get, update, clear };
