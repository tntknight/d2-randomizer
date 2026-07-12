export const DUNGEONS = [
  {
    id: 'shattered-throne',
    name: 'Shattered Throne',
    encounters: [
      { name: 'Descent',                             roles: ['Runner', 'Add Clear', 'Add Clear'] },
      { name: 'Vorgeth, the Boundless Hunger',        roles: ['Left Warden', 'Right Warden', 'Relic'] },
      { name: "Dul Incaru, the Eternal Return",       roles: ['Left', 'Right', 'Middle'] },
    ],
  },
  {
    id: 'pit-of-heresy',
    name: 'Pit of Heresy',
    encounters: [
      { name: 'Necropolis',                          roles: ['Left Totem', 'Middle Totem', 'Right Totem'] },
      { name: 'Harrow',                              roles: ['Ogre', 'Knight', 'Shaman'] },
      { name: 'Chamber of Suffering',                roles: ['Left', 'Right', 'Timer'] },
      { name: 'Zulmak, Instrument of Torment',       roles: ['Left Totems', 'Right Totems', 'Sword Bearer'] },
    ],
  },
  {
    id: 'prophecy',
    name: 'Prophecy',
    encounters: [
      { name: 'Phalanx Echo',  roles: ['Mote Runner', 'Mote Runner', 'Mote Runner'] },
      { name: 'Hexahedron',    roles: ['Runner', 'Runner', 'Runner'] },
      { name: 'Kell Echo',     roles: ['Left', 'Right', 'Middle'] },
    ],
  },
  {
    id: 'grasp-of-avarice',
    name: 'Grasp of Avarice',
    encounters: [
      { name: "Phry'zhia the Insatiable",  roles: ['Runner', 'Add Clear', 'Add Clear'] },
      { name: 'Fallen Shield',             roles: ['Left', 'Right', 'Caller'] },
      { name: 'Avarokk the Covetous',      roles: ['Bomb Runner', 'Add Clear', 'Caller'] },
    ],
  },
  {
    id: 'duality',
    name: 'Duality',
    encounters: [
      { name: "Gahlran's Deception",        roles: ['Bell 1', 'Bell 2', 'Bell 3'] },
      { name: "Vault",                      roles: ['Bell 1', 'Bell 2', 'Bell 3'] },
      { name: 'Nightmare of Caiatl',        roles: ['Bell 1', 'Bell 2', 'Bell 3'] },
    ],
  },
  {
    id: 'spire-of-the-watcher',
    name: 'Spire of the Watcher',
    encounters: [
      { name: 'Ascent',                          roles: ['Left', 'Middle', 'Right'] },
      { name: "Akelous, the Siren's Current",    roles: ['Left Scanner', 'Right Scanner', 'Tether'] },
      { name: 'Persys, Primordial Ruin',         roles: ['Left', 'Right', 'Caller'] },
    ],
  },
  {
    id: 'ghosts-of-the-deep',
    name: 'Ghosts of the Deep',
    encounters: [
      { name: 'Ecthar, Sword of Oryx',  roles: ['Sword Bearer', 'Left', 'Right'] },
      { name: 'Siren of the Deep',      roles: ['Left', 'Middle', 'Right'] },
    ],
  },
  {
    id: 'warlords-ruin',
    name: "Warlord's Ruin",
    encounters: [
      { name: 'Encounter 1',                         roles: ['Left', 'Middle', 'Right'] },
      { name: "Hefnd's Vengeance, Blighted Shard",   roles: ['Left Knight', 'Right Knight', 'Runner'] },
      { name: 'Vorlog, Risen in Ruin',               roles: ['Left', 'Right', 'Runner'] },
    ],
  },
  {
    id: 'vespers-host',
    name: "Vesper's Host",
    encounters: [
      { name: 'Security Override',  roles: ['Left', 'Right', 'Runner'] },
      { name: 'Raneiks Unified',    roles: ['Tether', 'Shield Breaker', 'Support'] },
      { name: 'Ives, Reflections',  roles: ['Left', 'Right', 'Caller'] },
    ],
  },
  {
    id: 'sundered-doctrine',
    name: 'Sundered Doctrine',
    encounters: [
      { name: 'Encounter 1', roles: ['Left', 'Middle', 'Right'] },
      { name: 'Encounter 2', roles: ['Left', 'Middle', 'Right'] },
      { name: 'Encounter 3', roles: ['Left', 'Middle', 'Right'] },
    ],
  },
];

export function pickRandomDungeon(excludeId = null) {
  const pool = excludeId ? DUNGEONS.filter(d => d.id !== excludeId) : DUNGEONS;
  return pool[Math.floor(Math.random() * pool.length)];
}
