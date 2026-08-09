import guidedSession from './guidedSession.js';
import pvpRandomSession from './pvpRandomSession.js';
import srlLobbySession from './srlLobbySession.js';
import { startRaidWatching, isRaidWatching } from './raidWatcher.js';
import { startWatching as startPvpRandomWatching } from './pvpRandomWatcher.js';
import { startWatching as startSrlLobbyWatching } from './srlLobbyWatcher.js';
import { isLinked } from '../auth/tokenStore.js';

// Session state survives a restart via disk-backed session stores, but the
// watchers that poll Bungie for match/race results are pure in-memory
// setIntervals — they don't. Re-arm them for every lobby that was restored so
// rankings keep updating after a deploy instead of silently going stale.
export async function resumeLobbyWatchers(client) {
  await Promise.all([
    resumeGuided(client),
    resumePvpRandom(client),
    resumeSrlLobby(client),
  ]);
}

async function resumeGuided(client) {
  for (const session of guidedSession.all()) {
    if (!isLinked(session.hostId) || isRaidWatching(session.hostId)) continue;
    try {
      const channel = await client.channels.fetch(session.lobbyChannelId);
      await startRaidWatching(session.hostId, channel);
    } catch (err) {
      console.warn('[resumeSessions] guided raid watcher restart failed:', err.message);
    }
  }
}

async function resumePvpRandom(client) {
  for (const session of pvpRandomSession.all()) {
    if (!isLinked(session.hostId)) {
      pvpRandomSession.update(session.guildId, { rankingsActive: false });
      continue;
    }
    try {
      const channel = await client.channels.fetch(session.lobbyChannelId);
      await startPvpRandomWatching(session.guildId, session.hostId, channel);
      pvpRandomSession.update(session.guildId, { rankingsActive: true });
    } catch (err) {
      pvpRandomSession.update(session.guildId, { rankingsActive: false });
      console.warn('[resumeSessions] pvp-random watcher restart failed:', err.message);
    }
  }
}

async function resumeSrlLobby(client) {
  for (const session of srlLobbySession.all()) {
    if (!isLinked(session.hostId)) {
      srlLobbySession.update(session.guildId, { rankingsActive: false });
      continue;
    }
    try {
      const channel = await client.channels.fetch(session.lobbyChannelId);
      await startSrlLobbyWatching(session.guildId, session.hostId, channel);
      srlLobbySession.update(session.guildId, { rankingsActive: true });
    } catch (err) {
      srlLobbySession.update(session.guildId, { rankingsActive: false });
      console.warn('[resumeSessions] srl-lobby watcher restart failed:', err.message);
    }
  }
}
