import { RAIDS } from './raidData.js';
import { createLobbyStore } from './persistentLobbyStore.js';

export const MAX_PLAYERS = 6;

const store = createLobbyStore('guidedSessions.json');

function create(guildId, hostId, channelId, raidId) {
  const raid = RAIDS.find(r => r.id === raidId);
  if (!raid) throw new Error(`Unknown raidId: ${raidId}`);
  return store.create(guildId, {
    guildId,
    hostId,
    lobbyChannelId: channelId,
    lobbyMessageId: null,
    phase: 'lobby',
    players: [],
    raid,
    currentEncounterIndex: 0,
    lastActivity: Date.now(),
  });
}

export default { create, get: store.get, update: store.update, clear: store.clear, all: store.all, MAX_PLAYERS };
