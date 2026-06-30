const SLOTS = [
  { key: 'kineticslot', label: 'Kinetic' },
  { key: 'energy',      label: 'Energy'  },
  { key: 'power',       label: 'Power'   },
];

function randFrom(arr) {
  return arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;
}

/**
 * Pick one random weapon per slot from matchData.
 * Rules:
 *   - Max one Exotic across the whole loadout
 *   - Kinetic and Energy slots cannot both be special ammo
 *
 * @param {Array} matchData
 * @returns {Array<{slot, pick}>} — one entry per slot; pick may be null if no weapons available
 */
export function pickLoadout(matchData) {
  let picks = SLOTS.map(slot => {
    const pool = matchData.filter(e => e.category === slot.key);
    return { slot, pick: randFrom(pool), pool };
  });

  // Prevent double-special (kinetic + energy both using special ammo)
  const kSlot = picks.find(p => p.slot.key === 'kineticslot');
  const eSlot = picks.find(p => p.slot.key === 'energy');
  if (kSlot?.pick?.ammo === 'special' && eSlot?.pick?.ammo === 'special') {
    const swapTarget = Math.random() < 0.5 ? kSlot : eSlot;
    swapTarget.pick = randFrom(swapTarget.pool.filter(w => w.ammo !== 'special'));
  }

  // Enforce max one exotic LAST — runs after all other swaps so nothing can re-introduce a second exotic
  const exoticIdxs = picks
    .map((p, i) => (p.pick?.exotic ? i : -1))
    .filter(i => i !== -1);

  if (exoticIdxs.length > 1) {
    const keepIdx = exoticIdxs[Math.floor(Math.random() * exoticIdxs.length)];
    exoticIdxs.forEach(i => {
      if (i === keepIdx) return;
      picks[i].pick = randFrom(picks[i].pool.filter(e => !e.exotic));
    });
  }

  return picks;
}

export { SLOTS };
