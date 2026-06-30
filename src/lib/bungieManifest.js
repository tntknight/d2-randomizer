/**
 * Shared Bungie manifest cache — one instance for the whole bot, all users share it.
 * Downloads the DestinyInventoryItemDefinition JSON once per bot session and builds
 * a lean hash -> iconUrl map.
 */

let iconMap = null;       // string hash -> full icon URL
let loadPromise = null;   // prevents concurrent fetches on startup

/**
 * Returns the icon URL for a given item hash, or null if unavailable.
 */
export async function getIconUrl(hash) {
  if (!hash) return null;
  const map = await ensureManifest();
  return map?.[String(hash)] ?? null;
}

/**
 * Kick off the manifest download early (call this in client.once('ready')).
 * Safe to call multiple times — subsequent calls return the same promise.
 */
export function preloadManifest() {
  ensureManifest().catch(e => console.error('[Manifest] Preload failed:', e));
}

async function ensureManifest() {
  if (iconMap) return iconMap;
  if (loadPromise) return loadPromise;

  loadPromise = fetchManifest().finally(() => {
    loadPromise = null;
  });

  return loadPromise;
}

async function fetchManifest() {
  console.log('[Manifest] Fetching manifest paths...');

  const metaRes = await fetch('https://www.bungie.net/Platform/Destiny2/Manifest/', {
    headers: { 'X-API-Key': process.env.BUNGIE_API_KEY },
  });
  const meta = await metaRes.json();

  const itemPath = meta?.Response?.jsonWorldComponentContentPaths?.en?.DestinyInventoryItemDefinition;
  if (!itemPath) throw new Error('[Manifest] Could not resolve item definition path');

  console.log('[Manifest] Downloading item definitions (~15-20 MB)...');
  const itemRes = await fetch(`https://www.bungie.net${itemPath}`);
  const items = await itemRes.json();

  // Build lean map: only keep icon URLs, discard everything else
  iconMap = {};
  for (const [hash, def] of Object.entries(items)) {
    const icon = def?.displayProperties?.icon;
    if (icon) iconMap[hash] = `https://www.bungie.net${icon}`;
  }

  console.log(`[Manifest] Loaded ${Object.keys(iconMap).length} icon entries.`);
  return iconMap;
}
