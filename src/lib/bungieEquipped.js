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

async function getItemDef(hash, accessToken) {
  if (!hash) return { name: 'Unknown', iconUrl: null };
  const def = await bungieGet(
    `/Destiny2/Manifest/DestinyInventoryItemDefinition/${hash}/`,
    accessToken
  );
  const icon = def.displayProperties?.icon;
  return {
    name:    def.displayProperties?.name ?? 'Unknown',
    iconUrl: icon ? `${BUNGIE_CDN}${icon}` : null,
  };
}

export async function fetchEquippedAppearance(discordUserId) {
  const accessToken = await getValidAccessToken(discordUserId);
  const { membershipType, membershipId } = getTokens(discordUserId);

  const profile = await bungieGet(
    `/Destiny2/${membershipType}/Profile/${membershipId}/?components=200,205`,
    accessToken
  );

  // Find most recently played character
  const characters = profile.characters?.data ?? {};
  const recentCharId = Object.entries(characters)
    .sort(([, a], [, b]) => new Date(b.dateLastPlayed) - new Date(a.dateLastPlayed))[0]?.[0];

  if (!recentCharId) throw new Error('no-characters');

  const equipped = profile.characterEquipment?.data?.[recentCharId]?.items ?? [];

  // Map bucket hash -> item hash
  const byBucket = {};
  for (const item of equipped) {
    byBucket[item.bucketHash] = item.itemHash;
  }

  const [ghost, helmet, gauntlets, chest, legs, classItem] = await Promise.all([
    getItemDef(byBucket[BUCKET.ghost],     accessToken),
    getItemDef(byBucket[BUCKET.helmet],    accessToken),
    getItemDef(byBucket[BUCKET.gauntlets], accessToken),
    getItemDef(byBucket[BUCKET.chest],     accessToken),
    getItemDef(byBucket[BUCKET.legs],      accessToken),
    getItemDef(byBucket[BUCKET.classItem], accessToken),
  ]);

  return { ghost, helmet, gauntlets, chest, legs, classItem };
}
