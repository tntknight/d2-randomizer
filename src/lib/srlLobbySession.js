import { createLobbyStore } from './persistentLobbyStore.js';

const store = createLobbyStore('srlLobbySessions.json');

function create(guildId, hostId, channelId) {
  return store.create(guildId, {
    guildId,
    hostId,
    lobbyMessageId: null,
    lobbyChannelId: channelId,
    maxPlayers:     6,
    players:        [],
    rankings:       {},    // userId -> { username, points, matches }
    rankingsActive: false, // whether the host's activity is currently being watched
    lastActivity:   Date.now(),
  });
}

export default { create, get: store.get, update: store.update, clear: store.clear, all: store.all };
