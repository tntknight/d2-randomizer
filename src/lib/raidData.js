export const RAIDS = [
  {
    id: 'last-wish',
    name: 'Last Wish',
    encounters: [
      { name: 'Kalli, the Corrupted',           roles: ['Room 1', 'Room 2', 'Room 3', 'Room 4', 'Room 5', 'Room 6'] },
      { name: 'Shuro Chi, the Corrupted',        roles: ['Plate 1', 'Plate 2', 'Plate 3', 'Plate 4', 'Add Clear', 'Add Clear'] },
      { name: 'Morgeth, the Spirekeeper',         roles: ['Right 1st', 'Right 2nd', 'Left 1st', 'Left Second', 'Cleanse 1st', 'Cleanse 2nd'] },
      { name: 'The Vault',                        roles: ['Read Stairs', 'Read Trees', 'Read Rock', 'Defend Stairs', 'Defend Trees', 'Defend Rock'] },
      { name: 'Riven of a Thousand Voices',       roles: ['Cleanse Right 1', 'Cleanse Right 2', 'Eyes Right', 'Cleanse Left 1', 'Cleanse Left 2', 'Eyes Left'] },
      { name: 'Queenswalk',                       roles: ['Run', 'Run', 'Run', 'Run', 'Run', 'Run'] },
    ],
  },
  {
    id: 'garden-of-salvation',
    name: 'Garden of Salvation',
    encounters: [
      { name: 'Evade the Consecrated Mind',    roles: ['Babbysit 1', 'Babbysit 2', 'Babbysit 3', 'Run 1', 'Run 2', 'Run 3'] },
      { name: 'Summon the Consecrated Mind',    roles: ['Pillar 1', 'Pillar 2', 'Pillar 3', 'Pillar 4', 'Runner 1', 'Runner 2'] },
      { name: 'Consecrated Mind, Sol Inherent', roles: ['Eyes 1', 'Eyes 2', 'Eyes 3', 'Gambit 1', 'Gambit 2', 'Gambit 3'] },
      { name: 'Sanctified Mind, Sol Inherent',  roles: ['Gambit Dark 1', 'Gambit Dark 2', 'Gambit Light 1', 'Gambit Light 2', 'Build 1', 'Build 2'] },
    ],
  },
  {
    id: 'deep-stone-crypt',
    name: 'Deep Stone Crypt',
    encounters: [
      { name: 'Security',                   roles: ['Light Scanner', 'Dark Scanner', 'Operator', 'Add Clear Dark', 'Add Clear Light', 'Add Clear Light'] },
      { name: 'Atraks-1',                   roles: ['Sanner', 'Operator', 'Space', 'Gorund Left', 'Gorund Middle', 'Gorund Right'] },
      { name: 'Descent',                    roles: ['Scanner 1', 'Suppressor 1', 'Operator 1', 'Scanner 2', 'Suppressor 2', 'Operator 2'] },
      { name: 'Taniks, the Abomination',    roles: ['Suppressor', 'Operator', 'Carrier 1', 'Carrier 2', 'Carrier 3', 'Carrier 4'] },
    ],
  },
  {
    id: 'vault-of-glass',
    name: 'Vault of Glass',
    encounters: [
      { name: 'Spire of Stars',             roles: ['Left Plate 1', 'Left Plate 2', 'Right Plate 1', 'Right Plate 2', 'Middle Plate 1', 'Middle Plate 2'] },
      { name: 'Confluxes',                  roles: ['Left Piller 1', 'Middle Piller 1', 'Right Piller 1', 'Left Piller 2', 'Middle Piller 2', 'Right Piller 2'] },
      { name: 'Oracles',                    roles: ['Oracles 1&2', 'Oracle 3', 'Oracle 4', 'Oracle 5', 'Oracle 6', 'Oracle 7'] },
      { name: 'Templar',                    roles: ['Relic Holder', 'Oracles Right', 'Oracles Left', 'DPS', 'DPS', 'DPS'] },
      { name: "Awaken the Glass Throne",    roles: ['Relic Start', 'Plate Mars', 'Plate Venus', 'Inside Mars', 'Inside Venus', 'Float'] },
      { name: "Atheon, Time's Conflux",     roles: ['DPS', 'DPS', 'DPS', 'MDPS', 'DPS', 'DPS'] },
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
