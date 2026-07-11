export const RAIDS = [
  {
    id: 'last-wish',
    name: 'Last Wish',
    encounters: [
      { name: 'Kalli, the Corrupted',           roles: ['Platform Caller', 'Left Slayer', 'Right Slayer', 'Middle Slayer', 'DPS Lead', 'Wipe Prevention'] },
      { name: 'Shuro Chi, the Corrupted',        roles: ['Puzzle Caller', 'Safe Spot', 'Safe Spot', 'Chest Runner', 'DPS Lead', 'Support'] },
      { name: 'Morgeth, the Spirekeeper',         roles: ['Left Empowered', 'Right Empowered', 'Left Runner', 'Right Runner', 'DPS Lead', 'Support'] },
      { name: 'The Vault',                        roles: ['Spotter', 'Left Plate', 'Right Plate', 'Middle Plate', 'Blocker Killer', 'DPS'] },
      { name: 'Riven of a Thousand Voices',       roles: ['Oracle Caller', 'Left Eyes', 'Right Eyes', 'Left Claws', 'Right Claws', 'DPS'] },
      { name: 'Queenswalk',                       roles: ['Left Side', 'Right Side', 'Middle Caller', 'DPS Lead', 'Guide', 'Support'] },
    ],
  },
  {
    id: 'garden-of-salvation',
    name: 'Garden of Salvation',
    encounters: [
      { name: 'Evade the Consecrated Mind',    roles: ['Left', 'Right', 'Middle', 'Blocker Killer', 'Runner', 'Caller'] },
      { name: 'Consecrated Mind, Sol Inherent', roles: ['Left', 'Right', 'Tether', 'DPS Lead', 'Caller', 'Support'] },
      { name: 'Sanctified Mind, Sol Inherent',  roles: ['Left Cannon', 'Right Cannon', 'Keeper', 'Caller', 'DPS Lead', 'Support'] },
    ],
  },
  {
    id: 'deep-stone-crypt',
    name: 'Deep Stone Crypt',
    encounters: [
      { name: 'Security',                   roles: ['Left Scanner', 'Right Scanner', 'Left Suppressor', 'Right Suppressor', 'Augment Runner', 'DPS Lead'] },
      { name: 'Atraks-1',                   roles: ['Left Scanner', 'Right Scanner', 'Left Operator', 'Right Operator', 'Space Scanner', 'DPS'] },
      { name: 'Descent',                    roles: ['Scanner', 'Suppressor', 'Operator', 'Replicant Handler', 'Runner', 'DPS'] },
      { name: 'Taniks, the Abomination',    roles: ['Carrier 1', 'Carrier 2', 'Carrier 3', 'Operator', 'Scanner', 'Suppressor'] },
    ],
  },
  {
    id: 'vault-of-glass',
    name: 'Vault of Glass',
    encounters: [
      { name: 'Spire of Stars',             roles: ['Left Plate', 'Right Plate', 'Middle Plate', 'Blocker', 'Blocker', 'Caller'] },
      { name: 'Confluxes',                  roles: ['Left', 'Middle', 'Right', 'Blocker', 'Blocker', 'Caller'] },
      { name: 'Oracles',                    roles: ['Scanner', 'Left', 'Right', 'Middle', 'Suppressor', 'Caller'] },
      { name: 'Templar',                    roles: ['Relic Holder', 'Left Sniper', 'Right Sniper', 'Blocker', 'Blocker', 'Caller'] },
      { name: "Gorgons' Labyrinth",         roles: ['Gaze Holder', 'Left Side', 'Right Side', 'Navigator', 'Rear Guard', 'Support'] },
      { name: "Atheon, Time's Conflux",     roles: ['Left Oracle', 'Right Oracle', 'Relic Holder', 'Middle Caller', 'Left DPS', 'Right DPS'] },
    ],
  },
  {
    id: 'vow-of-the-disciple',
    name: 'Vow of the Disciple',
    encounters: [
      { name: 'Acquisition',                        roles: ['Glyph Caller', 'Left', 'Right', 'Runner', 'Runner', 'DPS'] },
      { name: 'Caretaker',                          roles: ['Scanner', 'Caller', 'Stopper', 'Obelisk 1', 'Obelisk 2', 'DPS'] },
      { name: 'Exhibition',                         roles: ['Glyph Caller', 'Left', 'Right', 'Runner', 'Runner', 'Support'] },
      { name: 'Rhulk, Disciple of the Witness',    roles: ['Left Leeching Essence', 'Right Leeching Essence', 'DPS Lead', 'Caller', 'Off', 'Support'] },
    ],
  },
  {
    id: 'kings-fall',
    name: "King's Fall",
    encounters: [
      { name: 'Totems',               roles: ['Left Totem', 'Right Totem', 'Rune Runner', 'Caller', 'DPS', 'Support'] },
      { name: 'Warpriest',            roles: ['Glyph Caller', 'Left', 'Right', 'Relic Holder', 'DPS', 'Support'] },
      { name: 'Golgoroth',            roles: ['Gaze Holder', 'Left Orb', 'Right Orb', 'Caller', 'DPS Lead', 'DPS'] },
      { name: 'Daughters of Oryx',   roles: ['Left Platform', 'Right Platform', 'Relic Holder', 'Caller', 'DPS', 'Support'] },
      { name: 'Oryx, the Taken King', roles: ['Bomb Runner', 'Bomb Runner', 'Left Brand', 'Right Brand', 'Middle Brand', 'Caller'] },
    ],
  },
  {
    id: 'root-of-nightmares',
    name: 'Root of Nightmares',
    encounters: [
      { name: 'Cataclysm',                          roles: ['Left Field', 'Right Field', 'Runner', 'Caller', 'DPS Lead', 'Support'] },
      { name: 'Scission',                           roles: ['Psion Caller', 'Left', 'Right', 'Runner', 'DPS Lead', 'Support'] },
      { name: "Zo'aurc, Explicator of Planets",    roles: ['Left Planets', 'Right Planets', 'Runner', 'Caller', 'DPS Lead', 'Support'] },
      { name: 'Nezarec, Final God of Pain',         roles: ['Left Fear Feeder', 'Right Fear Feeder', 'Caller', 'Knife Juggler', 'DPS', 'Support'] },
    ],
  },
  {
    id: 'crotas-end',
    name: "Crota's End",
    encounters: [
      { name: 'The Abyss',               roles: ['Lantern Carrier', 'Runner', 'Runner', 'Blocker Killer', 'Caller', 'Support'] },
      { name: 'The Bridge',              roles: ['Left Sword', 'Right Sword', 'Bridge Keeper', 'Runner', 'Caller', 'DPS'] },
      { name: "Ir Yût, the Deathsinger", roles: ['Left Knights', 'Right Knights', 'Left Mid', 'Right Mid', 'Caller', 'DPS'] },
      { name: "Crota, Son of Oryx",      roles: ['Sword Bearer', 'Overshield Provider', 'Amp Caller', 'Shielder Killer', 'DPS', 'DPS'] },
    ],
  },
  {
    id: 'salvations-edge',
    name: "Salvation's Edge",
    encounters: [
      { name: 'Substratum',  roles: ['Left', 'Right', 'Middle', 'Runner', 'Caller', 'Support'] },
      { name: 'Dissent',     roles: ['Left', 'Right', 'Caller', 'DPS Lead', 'Support', 'Off'] },
      { name: 'Repository',  roles: ['Platform Runner', 'Platform Runner', 'Caller', 'Left', 'Right', 'DPS'] },
      { name: 'Verity',      roles: ['Shape Caller', 'Left', 'Right', 'DPS Lead', 'Holder', 'Off'] },
      { name: 'The Witness', roles: ['Left', 'Right', 'Caller', 'DPS Lead', 'Anchor', 'Support'] },
    ],
  },
  {
    id: 'vespers-host',
    name: "Vesper's Host",
    encounters: [
      { name: 'Security Override', roles: ['Left', 'Right', 'Caller', 'DPS Lead', 'Support', 'Runner'] },
      { name: 'Raneiks Unified',   roles: ['Tether', 'Shield Breaker', 'Caller', 'DPS', 'DPS', 'Support'] },
      { name: 'Ives, Reflections', roles: ['Left', 'Right', 'Caller', 'DPS Lead', 'Support', 'Off'] },
    ],
  },
];

export function pickRandomRaid(excludeId = null) {
  const pool = excludeId ? RAIDS.filter(r => r.id !== excludeId) : RAIDS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
