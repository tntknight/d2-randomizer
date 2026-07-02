const BASE = 'https://www.bungie.net/Platform';
const apiHeaders = () => ({ 'X-API-Key': process.env.BUNGIE_API_KEY });

// Returns an array of character ID strings for the given membership
export async function getCharacterIds(membershipType, membershipId) {
  const res  = await fetch(`${BASE}/Destiny2/${membershipType}/Profile/${membershipId}/?components=200`, { headers: apiHeaders() });
  const json = await res.json();
  if (json.ErrorCode !== 1) throw new Error(`GetProfile failed: ${json.Message}`);
  return Object.keys(json.Response?.characters?.data ?? {});
}

// Returns the single most recent PvP activity object for one character, or null
export async function getLatestPvpActivity(membershipType, membershipId, characterId) {
  const res  = await fetch(
    `${BASE}/Destiny2/${membershipType}/Account/${membershipId}/Character/${characterId}/Stats/Activities/?mode=5&count=1&page=0`,
    { headers: apiHeaders() }
  );
  const json = await res.json();
  if (json.ErrorCode !== 1) return null;
  return json.Response?.activities?.[0] ?? null;
}

// Returns the full PGCR for a completed activity instance, or null
export async function getPGCR(instanceId) {
  const res  = await fetch(`${BASE}/Destiny2/Stats/PostGameCarnageReport/${instanceId}/`, { headers: apiHeaders() });
  const json = await res.json();
  if (json.ErrorCode !== 1) return null;
  return json.Response ?? null;
}
