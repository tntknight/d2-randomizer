import { getTokens, saveTokens } from '../auth/tokenStore.js';
import { refreshAccessToken } from '../auth/bungieOAuth.js';

const BUNGIE_BASE = 'https://www.bungie.net/Platform';
const BUNGIE_CDN  = 'https://www.bungie.net';

const BUCKET = {
  ghost:     4023194814,
  helmet:    3448274439,
  gauntlets: 3551918588,
  chest:     14239492,
  legs:      20886954,
  classItem: 1585787867,
};

// Definitions are static game data, safe to cache for the life of the process.
const itemDefCache = new Map();
const socketTypeDefCache = new Map();

async function bungieGet(path, accessToken) {
  const res = await fetch(`${BUNGIE_BASE}${path}`, {
    signal: AbortSignal.timeout(10_000),
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-API-Key':     process.env.BUNGIE_API_KEY,
    },
  });
  if (!res.ok) throw new Error(`Bungie API error: ${res.status}`);
  const json = await res.json();
  if (json.ErrorCode !== 1) throw new Error(`Bungie error: ${json.Message}`);
  return json.Response;
}

async function getValidAccessToken(discordUserId) {
  const stored = getTokens(discordUserId);
  if (!stored) throw new Error('no-link');

  if (stored.expiresAt - Date.now() < 120_000) {
    try {
      const refreshed = await refreshAccessToken(stored.refreshToken);
      saveTokens(discordUserId, { ...stored, ...refreshed });
      return refreshed.accessToken;
    } catch {
      throw new Error('refresh-failed');
    }
  }

  return stored.accessToken;
}

async function getFullItemDef(hash, accessToken) {
  if (itemDefCache.has(hash)) return itemDefCache.get(hash);
  const def = await bungieGet(`/Destiny2/Manifest/DestinyInventoryItemDefinition/${hash}/`, accessToken);
  itemDefCache.set(hash, def);
  return def;
}

async function getSocketTypeDef(hash, accessToken) {
  if (socketTypeDefCache.has(hash)) return socketTypeDefCache.get(hash);
  const def = await bungieGet(`/Destiny2/Manifest/DestinySocketTypeDefinition/${hash}/`, accessToken);
  socketTypeDefCache.set(hash, def);
  return def;
}

function toAppearance(def) {
  const icon = def?.displayProperties?.icon;
  return {
    name:    def?.displayProperties?.name ?? 'Unknown',
    iconUrl: icon ? `${BUNGIE_CDN}${icon}` : null,
  };
}

async function getItemDef(hash, accessToken) {
  if (!hash) return { name: 'Unknown', iconUrl: null };
  return toAppearance(await getFullItemDef(hash, accessToken));
}

// Resolves what an equipped item actually looks like in-game, factoring in
// any Ornament/transmog plugged into its skin socket — the base item's own
// definition only reflects its un-transmogged appearance. Skin sockets are
// identified by their plug whitelist's categoryIdentifier (e.g.
// "armor_skins_hunter_head", "armor_skins_empty") rather than by the UI
// "ARMOR COSMETICS" socket category, which also groups in the shader socket —
// treating a shader change as a transmog would show the shader's swatch icon
// instead of the armor's.
async function getEquippedAppearance(itemHash, itemInstanceId, socketsByInstance, accessToken) {
  if (!itemHash) return { name: 'Unknown', iconUrl: null };

  const fullDef = await getFullItemDef(itemHash, accessToken);
  const baseAppearance = toAppearance(fullDef);

  const socketEntries = fullDef.sockets?.socketEntries ?? [];
  const equippedSockets = socketsByInstance?.[itemInstanceId]?.sockets ?? [];

  for (let i = 0; i < socketEntries.length; i++) {
    const entry = socketEntries[i];
    if (!entry.socketTypeHash) continue; // empty/unused socket slot — no definition to look up

    const typeDef = await getSocketTypeDef(entry.socketTypeHash, accessToken);
    if (!typeDef) continue; // manifest has no definition for this hash

    const isSkinSocket = (typeDef.plugWhitelist ?? []).some(p => /_skins/.test(p.categoryIdentifier ?? ''));
    if (!isSkinSocket) continue;

    const pluggedHash = equippedSockets[i]?.plugHash;
    if (!pluggedHash || pluggedHash === entry.singleInitialItemHash) continue;

    const ornamentAppearance = await getItemDef(pluggedHash, accessToken);
    if (ornamentAppearance.iconUrl) return ornamentAppearance;
  }

  return baseAppearance;
}

export async function fetchEquippedAppearance(discordUserId) {
  const accessToken = await getValidAccessToken(discordUserId);
  const { membershipType, membershipId } = getTokens(discordUserId);

  const profile = await bungieGet(
    `/Destiny2/${membershipType}/Profile/${membershipId}/?components=200,205,305`,
    accessToken
  );

  // Find most recently played character
  const characters = profile.characters?.data ?? {};
  const recentCharId = Object.entries(characters)
    .sort(([, a], [, b]) => new Date(b.dateLastPlayed) - new Date(a.dateLastPlayed))[0]?.[0];

  if (!recentCharId) throw new Error('no-characters');

  const equipped = profile.characterEquipment?.data?.[recentCharId]?.items ?? [];
  const socketsByInstance = profile.itemComponents?.sockets?.data ?? {};

  // Map bucket hash -> equipped item
  const byBucket = {};
  for (const item of equipped) {
    byBucket[item.bucketHash] = item;
  }

  const resolve = (bucket) => {
    const item = byBucket[bucket];
    return getEquippedAppearance(item?.itemHash, item?.itemInstanceId, socketsByInstance, accessToken);
  };

  const [ghost, helmet, gauntlets, chest, legs, classItem] = await Promise.all([
    resolve(BUCKET.ghost),
    resolve(BUCKET.helmet),
    resolve(BUCKET.gauntlets),
    resolve(BUCKET.chest),
    resolve(BUCKET.legs),
    resolve(BUCKET.classItem),
  ]);

  return { ghost, helmet, gauntlets, chest, legs, classItem };
}
