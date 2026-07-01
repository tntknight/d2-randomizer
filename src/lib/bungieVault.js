import { getTokens, saveTokens } from '../auth/tokenStore.js';
import { refreshAccessToken } from '../auth/bungieOAuth.js';
import { getWeaponDef } from './bungieManifest.js';

const BUNGIE_BASE = 'https://www.bungie.net/Platform';

async function bungieGet(path, accessToken) {
  const res = await fetch(`${BUNGIE_BASE}${path}`, {
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

  // Auto-refresh if the token is expiring within 2 minutes
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

/**
 * Fetches all weapons from a player's vault, character inventories, and equipped slots.
 * Deduplicates by item hash — each unique weapon type appears once.
 *
 * @returns {{ weapons: Array, displayName: string }}
 */
export async function fetchWeapons(discordUserId) {
  const accessToken = await getValidAccessToken(discordUserId);
  const { membershipType, membershipId, displayName } = getTokens(discordUserId);

  // components: 102 = vault, 201 = character inventories, 205 = equipped
  const profile = await bungieGet(
    `/Destiny2/${membershipType}/Profile/${membershipId}/?components=102,201,205`,
    accessToken
  );

  // Collect all unique item hashes across vault + characters
  const seenHashes = new Set();

  const itemSources = [
    profile.profileInventory?.data?.items ?? [],
    ...Object.values(profile.characterInventories?.data ?? {}).map(c => c.items ?? []),
    ...Object.values(profile.characterEquipment?.data  ?? {}).map(c => c.items ?? []),
  ];

  for (const items of itemSources) {
    for (const item of items) {
      seenHashes.add(String(item.itemHash));
    }
  }

  // Look up each hash in the manifest — only weapons have a def
  const weapons = [];
  for (const hash of seenHashes) {
    const def = await getWeaponDef(hash);
    if (def) weapons.push(def);
  }

  return { weapons, displayName };
}
