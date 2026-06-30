/**
 * Find weapons that appear in ALL loaded files (matched by name).
 *
 * @param {Array<{filename: string, weapons: Array}>} loadedFiles
 * @returns {Array} matchData — one entry per matched weapon name
 */
export function buildMatchData(loadedFiles) {
  const nameMap = new Map();

  loadedFiles.forEach((file, fi) => {
    file.weapons.forEach(weapon => {
      if (!nameMap.has(weapon.name)) {
        nameMap.set(weapon.name, {
          name:       weapon.name,
          hash:       weapon.hash,
          type:       weapon.type,
          category:   weapon.category,
          ammo:       weapon.ammo,
          exotic:     weapon.rarity === 'exotic',
          fileCounts: new Array(loadedFiles.length).fill(0),
          total:      0,
        });
      }
      const entry = nameMap.get(weapon.name);
      entry.fileCounts[fi]++;
      entry.total++;
    });
  });

  // Only keep weapons present in every file
  return [...nameMap.values()].filter(e => e.fileCounts.every(c => c > 0));
}
