export const RAIDS = [
  {
    id: 'last-wish',
    name: 'Last Wish',
    encounters: [
      { name: 'Kalli, the Corrupted',           roles: ['Room 1', 'Room 2', 'Room 3', 'Room 4', 'Room 5', 'Room 6'], imageUrl: null },
      { name: 'Shuro Chi, the Corrupted',        roles: ['Plate 1', 'Plate 2', 'Plate 3', 'Plate 4', 'Add Clear', 'Add Clear'], imageUrl: null },
      { name: 'Morgeth, the Spirekeeper',         roles: ['Right 1st', 'Right 2nd', 'Left 1st', 'Left Second', 'Cleanse 1st', 'Cleanse 2nd'], imageUrl: null },
      { name: 'The Vault',                        roles: ['Read Stairs', 'Read Trees', 'Read Rock', 'Defend Stairs', 'Defend Trees', 'Defend Rock'], imageUrl: null },
      { name: 'Riven of a Thousand Voices',       roles: ['Cleanse Right 1', 'Cleanse Right 2', 'Eyes Right', 'Cleanse Left 1', 'Cleanse Left 2', 'Eyes Left'], imageUrl: null },
      { name: 'Queenswalk',                       roles: ['Run', 'Run', 'Run', 'Run', 'Run', 'Run'], imageUrl: null },
    ],
  },
  {
    id: 'garden-of-salvation',
    name: 'Garden of Salvation',
    encounters: [
      { name: 'Evade the Consecrated Mind',    roles: ['Babbysit 1', 'Babbysit 2', 'Babbysit 3', 'Run 1', 'Run 2', 'Run 3'], imageUrl: null },
      { name: 'Summon the Consecrated Mind',    roles: ['Pillar 1', 'Pillar 2', 'Pillar 3', 'Pillar 4', 'Runner 1', 'Runner 2'], imageUrl: null },
      { name: 'Consecrated Mind, Sol Inherent', roles: ['Eyes 1', 'Eyes 2', 'Eyes 3', 'Gambit 1', 'Gambit 2', 'Gambit 3'], imageUrl: null },
      { name: 'Sanctified Mind, Sol Inherent',  roles: ['Gambit Dark 1', 'Gambit Dark 2', 'Gambit Light 1', 'Gambit Light 2', 'Build 1', 'Build 2'], imageUrl: null },
    ],
  },
  {
    id: 'deep-stone-crypt',
    name: 'Deep Stone Crypt',
    encounters: [
      { name: 'Security',                   roles: ['Light Scanner', 'Dark Scanner', 'Operator', 'Add Clear Dark', 'Add Clear Light', 'Add Clear Light'], imageUrl: null },
      { name: 'Atraks-1',                   roles: ['Sanner', 'Operator', 'Space', 'Gorund Left', 'Gorund Middle', 'Gorund Right'], imageUrl: null },
      { name: 'Descent',                    roles: ['Scanner 1', 'Suppressor 1', 'Operator 1', 'Scanner 2', 'Suppressor 2', 'Operator 2'], imageUrl: null },
      { name: 'Taniks, the Abomination',    roles: ['Suppressor', 'Operator', 'Carrier 1', 'Carrier 2', 'Carrier 3', 'Carrier 4'], imageUrl: null },
    ],
  },
  {
    id: 'vault-of-glass',
    name: 'Vault of Glass',
    encounters: [
      { name: 'Spire of Stars',             roles: ['Left Plate 1', 'Left Plate 2', 'Right Plate 1', 'Right Plate 2', 'Middle Plate 1', 'Middle Plate 2'], imageUrl: null },
      { name: 'Confluxes',                  roles: ['Left Piller 1', 'Middle Piller 1', 'Right Piller 1', 'Left Piller 2', 'Middle Piller 2', 'Right Piller 2'], imageUrl: null },
      { name: 'Oracles',                    roles: ['Oracles 1&2', 'Oracle 3', 'Oracle 4', 'Oracle 5', 'Oracle 6', 'Oracle 7'], imageUrl: null },
      { name: 'Templar',                    roles: ['Relic Holder', 'Oracles Right', 'Oracles Left', 'DPS', 'DPS', 'DPS'], imageUrl: null },
      { name: "Awaken the Glass Throne",    roles: ['Relic Start', 'Plate Mars', 'Plate Venus', 'Inside Mars', 'Inside Venus', 'Float'], imageUrl: null },
      { name: "Atheon, Time's Conflux",     roles: ['DPS', 'DPS', 'DPS', 'MDPS', 'DPS', 'DPS'], imageUrl: null },
    ],
  },
  {
    id: 'vow-of-the-disciple',
    name: 'Vow of the Disciple',
    encounters: [
      { name: 'Acquisition',                        roles: ['Glyph Caller', 'Left', 'Right', 'Runner', 'Runner', 'DPS'], imageUrl: null },
      { name: 'Caretaker',                          roles: ['Scanner', 'Caller', 'Stopper', 'Obelisk 1', 'Obelisk 2', 'DPS'], imageUrl: null },
      { name: 'Exhibition',                         roles: ['Glyph Caller', 'Left', 'Right', 'Runner', 'Runner', 'Support'], imageUrl: null },
      { name: 'Rhulk, Disciple of the Witness',    roles: ['Left Leeching Essence', 'Right Leeching Essence', 'DPS Lead', 'Caller', 'Off', 'Support'], imageUrl: null },
    ],
  },
  {
    id: 'kings-fall',
    name: "King's Fall",
    encounters: [
      { name: 'Totems',               roles: ['1st Left', '2nd Left', '3rd Left', '1st Right', '2nd Right', '3rd Right'], imageUrl: "https://cdn.discordapp.com/attachments/1410620693036404776/1410649004181819392/Kings-Fall-Totem-E1-v6.png?ex=6a58fa43&is=6a57a8c3&hm=8c5ce05b89aaae3abc0770203b4ce9832e95a04bcb30c17fa084c4c8bc6f2b62&" },
      { name: 'Warpriest',            roles: ['Plate Left', 'Plate Mid', 'Plate Right', 'Relic Left', 'Relic Mid', 'Relic Right'], imageUrl: "https://cdn.discordapp.com/attachments/1410620693036404776/1410649135597752493/3CIQ471hHj45LQPH_UXHnkpHKYapbASlyOT3O7X5tm4.webp?ex=6a58fa62&is=6a57a8e2&hm=59d44c2ee3110ffff040de93ff1cf73153bd6b574d448bb655fa66b808c42715&" },
      { name: 'Golgoroth',            roles: ['1st Gaze', '2nd Gaze', 'Pit', 'Pit', 'Pit', 'Pit'], imageUrl: "https://cdn.discordapp.com/attachments/1410620693036404776/1410649219785818193/Kings-Fall-Golgoroth-E3-v6.jpg?ex=6a58fa76&is=6a57a8f6&hm=85e22c696228a3abb48f8dc68581e39905068cac53c053cdbcfc1e6537550dc2&" },
      { name: 'Daughters of Oryx',    roles: ['Plate R1', 'Plate R2', 'Plate L1', 'Plate L2', 'Float Back', 'Float Front'], imageUrl: "https://cdn.discordapp.com/attachments/1410620693036404776/1410649937355608146/sisters_info.png?ex=6a58fb21&is=6a57a9a1&hm=c952cade70e814b21e73e2c97fb94cc8f97f8d025a5448da80b205a23c6077df&" },
      { name: 'Oryx, the Taken King', roles: ['Plate R1', 'Plate R2', 'Plate L1', 'Plate L2', 'Float Back', 'Float Front'], imageUrl: "https://cdn.discordapp.com/attachments/1410620693036404776/1410649986949189722/Destiny-2-Kings-Fall-Loot-table-infographic-v2.jpg?ex=6a58fb2d&is=6a57a9ad&hm=c83cff23839cf52be3288e451722c938aace76b14d59b9e7f39a7b151b31a636&" },
    ],
  },
  {
    id: 'root-of-nightmares',
    name: 'Root of Nightmares',
    encounters: [
      { name: 'Cataclysm',                          roles: ['Left Field', 'Right Field', 'Runner', 'Caller', 'DPS Lead', 'Support'], imageUrl: null },
      { name: 'Scission',                           roles: ['Psion Caller', 'Left', 'Right', 'Runner', 'DPS Lead', 'Support'], imageUrl: null },
      { name: "Zo'aurc, Explicator of Planets",    roles: ['Left Planets', 'Right Planets', 'Runner', 'Caller', 'DPS Lead', 'Support'], imageUrl: null },
      { name: 'Nezarec, Final God of Pain',         roles: ['Left Fear Feeder', 'Right Fear Feeder', 'Caller', 'Knife Juggler', 'DPS', 'Support'], imageUrl: null },
    ],
  },
  {
    id: 'crotas-end',
    name: "Crota's End",
    encounters: [
      { name: 'The Abyss',               roles: ['Lantern Carrier', 'Runner', 'Runner', 'Blocker Killer', 'Caller', 'Support'], imageUrl: null },
      { name: 'The Bridge',              roles: ['Left Sword', 'Right Sword', 'Bridge Keeper', 'Runner', 'Caller', 'DPS'], imageUrl: null },
      { name: "Ir Yût, the Deathsinger", roles: ['Left Knights', 'Right Knights', 'Left Mid', 'Right Mid', 'Caller', 'DPS'], imageUrl: null },
      { name: "Crota, Son of Oryx",      roles: ['Sword Bearer', 'Overshield Provider', 'Amp Caller', 'Shielder Killer', 'DPS', 'DPS'], imageUrl: null },
    ],
  },
  {
    id: 'salvations-edge',
    name: "Salvation's Edge",
    encounters: [
      { name: 'Substratum',  roles: ['Left', 'Right', 'Middle', 'Runner', 'Caller', 'Support'], imageUrl: null },
      { name: 'Dissent',     roles: ['Left', 'Right', 'Caller', 'DPS Lead', 'Support', 'Off'], imageUrl: null },
      { name: 'Repository',  roles: ['Platform Runner', 'Platform Runner', 'Caller', 'Left', 'Right', 'DPS'], imageUrl: null },
      { name: 'Verity',      roles: ['Shape Caller', 'Left', 'Right', 'DPS Lead', 'Holder', 'Off'], imageUrl: null },
      { name: 'The Witness', roles: ['Left', 'Right', 'Caller', 'DPS Lead', 'Anchor', 'Support'], imageUrl: null },
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
