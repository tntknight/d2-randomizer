import https from 'https';
import { createRequire } from 'module';

// stream-json@1 and stream-chain@2 are CJS — use createRequire from an ESM file
const require = createRequire(import.meta.url);
const { chain }        = require('stream-chain');
const { parser }       = require('stream-json');
const { streamObject } = require('stream-json/streamers/StreamObject');

let weaponDefMap = null;
let loadPromise  = null;

const TIER_TO_RARITY = { 6: 'exotic', 5: 'legendary', 4: 'rare', 3: 'uncommon', 2: 'common', 1: 'basic' };

const BUCKET_TO_CATEGORY = {
  1498876634: 'kineticslot',
  2465295065: 'energy',
  953998645:  'power',
};

const AMMO_TO_AMMO = { 1: 'primary', 2: 'special', 3: 'heavy' };

const SUBTYPE_TO_TYPE = {
  6:  'Auto Rifle',
  7:  'Shotgun',
  8:  'Fusion Rifle',
  9:  'Sniper Rifle',
  10: 'Pulse Rifle',
  11: 'Scout Rifle',
  12: 'Hand Cannon',
  13: 'Rocket Launcher',
  14: 'Sidearm',
  17: 'Submachine Gun',
  18: 'Trace Rifle',
  22: 'Linear Fusion Rifle',
  23: 'Grenade Launcher',
  24: 'Machine Gun',
  25: 'Combat Bow',
  26: 'Glaive',
  31: 'Sword',
};

export async function getIconUrl(hash) {
  if (!hash) return null;
  const { weapons } = await ensureManifest();
  return weapons?.[String(hash)]?.iconUrl ?? null;
}

export async function getWeaponDef(hash) {
  if (!hash) return null;
  const { weapons } = await ensureManifest();
  return weapons?.[String(hash)] ?? null;
}

export function preloadManifest() {
  ensureManifest().catch(e => console.error('[Manifest] Preload failed:', e));
}

async function ensureManifest() {
  if (weaponDefMap) return { weapons: weaponDefMap };
  if (loadPromise)  return loadPromise;

  loadPromise = fetchManifest().finally(() => { loadPromise = null; });
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

  console.log('[Manifest] Streaming item definitions...');

  // Use https.get for a native Node.js Readable — works reliably with stream-json
  const itemStream = await new Promise((resolve, reject) => {
    https.get(`https://www.bungie.net${itemPath}`, resolve).on('error', reject);
  });

  weaponDefMap = {};

  // Stream-parse so only one item is in memory at a time (~30MB peak vs ~500MB with JSON.parse)
  await new Promise((resolve, reject) => {
    const pipeline = chain([
      itemStream,
      parser(),
      streamObject(),
    ]);

    pipeline.on('data', ({ key: hash, value: def }) => {
      if (def.itemType !== 2 || !def.displayProperties?.name || def.redacted) return;

      const category = BUCKET_TO_CATEGORY[def.inventory?.bucketTypeHash];
      if (!category) return;

      const icon = def.displayProperties?.icon;
      weaponDefMap[hash] = {
        name:     def.displayProperties.name,
        hash,
        rarity:   TIER_TO_RARITY[def.inventory?.tierType] ?? 'common',
        type:     SUBTYPE_TO_TYPE[def.itemSubType] ?? 'Unknown',
        category,
        ammo:     AMMO_TO_AMMO[def.equippingBlock?.ammoType] ?? 'primary',
        iconUrl:  icon ? `https://www.bungie.net${icon}` : null,
      };
    });

    pipeline.on('end', resolve);
    pipeline.on('error', reject);
  });

  console.log(`[Manifest] Loaded ${Object.keys(weaponDefMap).length} weapon definitions.`);
  return { weapons: weaponDefMap };
}
