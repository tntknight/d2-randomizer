import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = join(__dirname, '../../data');

const TTL_MS   = 3 * 60 * 60 * 1000; // 3 hours
const SWEEP_MS = 10 * 60 * 1000;

function loadFromDisk(filePath) {
  if (!existsSync(filePath)) return [];
  try {
    return Object.entries(JSON.parse(readFileSync(filePath, 'utf8')));
  } catch {
    return [];
  }
}

// Backs an in-memory Map<guildId, session> with a JSON file so lobbies survive
// a bot restart (e.g. a deploy) instead of being silently orphaned — the
// Discord message stays up, but without this its buttons would report "This
// lobby has expired" forever after any restart.
export function createLobbyStore(fileName) {
  const filePath = join(DATA_DIR, fileName);
  const sessions = new Map(loadFromDisk(filePath));

  function persist() {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(filePath, JSON.stringify(Object.fromEntries(sessions), null, 2), 'utf8');
  }

  setInterval(() => {
    const now = Date.now();
    let changed = false;
    for (const [guildId, session] of sessions) {
      if (now - session.lastActivity > TTL_MS) {
        sessions.delete(guildId);
        changed = true;
      }
    }
    if (changed) persist();
  }, SWEEP_MS);

  function create(guildId, session) {
    sessions.set(guildId, session);
    persist();
    return session;
  }

  function get(guildId) {
    return sessions.get(guildId) ?? null;
  }

  function update(guildId, patch) {
    const session = sessions.get(guildId);
    if (!session) return null;
    Object.assign(session, patch, { lastActivity: Date.now() });
    persist();
    return session;
  }

  function clear(guildId) {
    if (sessions.delete(guildId)) persist();
  }

  function all() {
    return [...sessions.values()];
  }

  return { create, get, update, clear, all };
}
