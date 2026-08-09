import { createLobbyStore } from './persistentLobbyStore.js';

const MAX_REROLLS = 3;

const store = createLobbyStore('chaosSessions.json');

function create(guildId, hostId, channelId, type = 'raid') {
  return store.create(guildId, {
    guildId,
    hostId,
    lobbyMessageId:       null,
    lobbyChannelId:       channelId,
    type,                              // 'raid' | 'dungeon'
    maxPlayers:           type === 'dungeon' ? 3 : 6,
    phase:                'lobby',
    players:              [],
    classOptInPending:    0,
    raid:                 null,
    currentEncounterIndex: 0,
    rerollsUsed:          0,
    lastActivity:         Date.now(),
  });
}

export default { create, get: store.get, update: store.update, clear: store.clear, all: store.all, MAX_REROLLS };
