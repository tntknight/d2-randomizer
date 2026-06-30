/**
 * Build a DIM search string from an array of weapon objects (or names).
 * Result: name:"Ace of Spades" or name:"Anarchy" or ...
 *
 * @param {Array<{name: string}|string>} weapons
 * @returns {string}
 */
export function buildDimSearch(weapons) {
  return weapons
    .filter(Boolean)
    .map(w => `name:"${typeof w === 'string' ? w : w.name}"`)
    .join(' or ');
}
