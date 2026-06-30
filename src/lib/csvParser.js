import { parse } from 'csv-parse/sync';

/**
 * Parse a DIM CSV export string into an array of lean weapon objects.
 * Only keeps the 6 fields the bot actually uses — discards the 50+ perk/stat columns.
 */
export function parseWeaponCSV(text) {
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,           // DIM sometimes adds a UTF-8 BOM
    relax_column_count: true,
  });

  return records
    .filter(r => r.Name && r.Name.trim())
    .map(r => ({
      name:     r.Name.trim(),
      hash:     (r.Hash || '').trim(),
      rarity:   (r.Rarity || '').trim().toLowerCase(),
      type:     (r.Type || '').trim(),
      category: (r.Category || '').trim().toLowerCase(),
      ammo:     (r.Ammo || '').trim().toLowerCase(),
    }));
}
