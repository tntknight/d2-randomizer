import { getTokens, saveTokens } from '../auth/tokenStore.js';
import { refreshAccessToken } from '../auth/bungieOAuth.js';

const BASE = 'https://www.bungie.net/Platform';

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

async function bungiePost(path, accessToken, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-API-Key':     process.env.BUNGIE_API_KEY,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (json.ErrorCode !== 1) {
    const err = new Error(json.Message ?? 'Bungie API error');
    err.bungieCode = json.ErrorCode;
    throw err;
  }
  return json.Response;
}

/**
 * Finds an unequipped instance of itemHash across the player's vault and
 * character inventories, then transfers it to their most recently played character.
 *
 * Returns one of:
 *   { ok: true,  location: 'vault' | 'character' | 'already-here' }
 *   { ok: false, reason:   'not-owned' | 'only-equipped' | 'no-link' | 'refresh-failed' | string }
 */
export async function pullExoticToInventory(discordUserId, itemHash) {
  let accessToken;
  try {
    accessToken = await getValidAccessToken(discordUserId);
  } catch (err) {
    return { ok: false, reason: err.message };
  }

  const tokens = getTokens(discordUserId);
  const { membershipType, membershipId } = tokens;

  // Fetch vault + character inventories + equipped + character list
  const res = await fetch(
    `${BASE}/Destiny2/${membershipType}/Profile/${membershipId}/?components=200,102,201,205`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-API-Key':     process.env.BUNGIE_API_KEY,
      },
    }
  );
  const json = await res.json();
  if (json.ErrorCode !== 1) return { ok: false, reason: json.Message ?? 'Profile fetch failed' };

  const data = json.Response;

  // Most recently played character = transfer destination
  const chars = Object.values(data.characters?.data ?? {});
  if (!chars.length) return { ok: false, reason: 'No characters found' };
  chars.sort((a, b) => new Date(b.dateLastPlayed) - new Date(a.dateLastPlayed));
  const targetCharId = chars[0].characterId;

  // Search vault
  const vaultItems = data.profileInventory?.data?.items ?? [];
  const vaultMatch = vaultItems.find(i => i.itemHash === itemHash || i.itemHash === Number(itemHash));

  if (vaultMatch) {
    await bungiePost('/Destiny2/Actions/Items/TransferItem/', accessToken, {
      itemReferenceHash: Number(itemHash),
      stackSize:         1,
      transferToVault:   false,
      itemId:            vaultMatch.itemInstanceId,
      characterId:       targetCharId,
      membershipType:    Number(membershipType),
    });
    return { ok: true, location: 'vault' };
  }

  // Search character inventories (unequipped bags)
  for (const [charId, inv] of Object.entries(data.characterInventories?.data ?? {})) {
    const match = inv.items?.find(i => i.itemHash === itemHash || i.itemHash === Number(itemHash));
    if (!match) continue;

    if (charId === targetCharId) {
      return { ok: true, location: 'already-here' };
    }

    // Move off the other character: char → vault → target char
    await bungiePost('/Destiny2/Actions/Items/TransferItem/', accessToken, {
      itemReferenceHash: Number(itemHash),
      stackSize:         1,
      transferToVault:   true,
      itemId:            match.itemInstanceId,
      characterId:       charId,
      membershipType:    Number(membershipType),
    });
    await bungiePost('/Destiny2/Actions/Items/TransferItem/', accessToken, {
      itemReferenceHash: Number(itemHash),
      stackSize:         1,
      transferToVault:   false,
      itemId:            match.itemInstanceId,
      characterId:       targetCharId,
      membershipType:    Number(membershipType),
    });
    return { ok: true, location: 'character' };
  }

  // Check if it's only present as an equipped item (can't be moved without unequipping)
  const allEquipped = Object.values(data.characterEquipment?.data ?? {})
    .flatMap(eq => eq.items ?? []);
  const isEquipped = allEquipped.some(i => i.itemHash === itemHash || i.itemHash === Number(itemHash));

  if (isEquipped) return { ok: false, reason: 'only-equipped' };
  return { ok: false, reason: 'not-owned' };
}
