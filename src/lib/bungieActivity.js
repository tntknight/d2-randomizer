const BASE = 'https://www.bungie.net/Platform';
const apiHeaders = () => ({ 'X-API-Key': process.env.BUNGIE_API_KEY });

// Returns an array of character ID strings for the given membership
export async function getCharacterIds(membershipType, membershipId) {
  const res  = await fetch(`${BASE}/Destiny2/${membershipType}/Profile/${membershipId}/?components=200`, { headers: apiHeaders() });
  const json = await res.json();
  if (json.ErrorCode !== 1) throw new Error(`GetProfile failed: ${json.Message}`);
  return Object.keys(json.Response?.characters?.data ?? {});
}

// Returns the classType (0=Titan, 1=Hunter, 2=Warlock) of the most recently played character
export async function getMostRecentCharacterClass(membershipType, membershipId) {
  const res  = await fetch(`${BASE}/Destiny2/${membershipType}/Profile/${membershipId}/?components=200`, { headers: apiHeaders() });
  const json = await res.json();
  if (json.ErrorCode !== 1) return null;
  const chars = Object.values(json.Response?.characters?.data ?? {});
  if (!chars.length) return null;
  chars.sort((a, b) => new Date(b.dateLastPlayed) - new Date(a.dateLastPlayed));
  return chars[0].classType ?? null;
}

// Returns the most recent activity for one character filtered by mode, or null.
export async function getLatestActivityByMode(membershipType, membershipId, characterId, mode) {
  const res  = await fetch(
    `${BASE}/Destiny2/${membershipType}/Account/${membershipId}/Character/${characterId}/Stats/Activities/?mode=${mode}&count=1&page=0`,
    { headers: apiHeaders() }
  );
  const json = await res.json();
  if (json.ErrorCode !== 1) return null;
  return json.Response?.activities?.[0] ?? null;
}

// Returns the single most recent activity for one character (any mode), or null.
// We use mode=0 (no filter) so private matches (mode 32) are included alongside
// public PvP (mode 5). The caller filters non-PvP via the PGCR teams field.
export async function getLatestActivity(membershipType, membershipId, characterId) {
  const res  = await fetch(
    `${BASE}/Destiny2/${membershipType}/Account/${membershipId}/Character/${characterId}/Stats/Activities/?mode=0&count=1&page=0`,
    { headers: apiHeaders() }
  );
  const json = await res.json();
  if (json.ErrorCode !== 1) {
    console.log(`[Activity] ErrorCode=${json.ErrorCode} Message=${json.Message}`);
    return null;
  }
  const activities = json.Response?.activities;
  console.log(`[Activity] char=${characterId} count=${activities?.length ?? 0} mode=${activities?.[0]?.activityDetails?.mode ?? 'n/a'}`);
  return activities?.[0] ?? null;
}

// Returns the full PGCR for a completed activity instance, or null
export async function getPGCR(instanceId) {
  const res  = await fetch(`${BASE}/Destiny2/Stats/PostGameCarnageReport/${instanceId}/`, { headers: apiHeaders() });
  const json = await res.json();
  if (json.ErrorCode !== 1) return null;
  return json.Response ?? null;
}

// Returns the display name of an activity from its definition hash, or fallback
export async function getActivityName(referenceId, fallback = 'Raid') {
  if (!referenceId) return fallback;
  const res  = await fetch(`${BASE}/Destiny2/Manifest/DestinyActivityDefinition/${referenceId}/`, { headers: apiHeaders() });
  const json = await res.json();
  return json.Response?.displayProperties?.name ?? fallback;
}
