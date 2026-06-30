const TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Session shape:
 * {
 *   userId:       string,
 *   files:        Array<{ filename: string, weapons: Array }>,
 *   matchData:    Array | null,
 *   lastLoadout:  Array | null,   // last rolled picks from pickLoadout()
 *   lastActivity: number,         // Date.now()
 * }
 */
const sessions = new Map();

// Clean up expired sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [userId, session] of sessions) {
    if (now - session.lastActivity > TTL_MS) {
      sessions.delete(userId);
    }
  }
}, 5 * 60 * 1000);

function getOrCreate(userId) {
  if (!sessions.has(userId)) {
    sessions.set(userId, {
      userId,
      files:        [],
      matchData:    null,
      lastLoadout:  null,
      lastActivity: Date.now(),
    });
  }
  return sessions.get(userId);
}

function get(userId) {
  return sessions.get(userId) ?? null;
}

function touch(userId) {
  const s = sessions.get(userId);
  if (s) s.lastActivity = Date.now();
}

function clear(userId) {
  sessions.delete(userId);
}

export default { getOrCreate, get, touch, clear };
