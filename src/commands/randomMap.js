import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const MAPS = [
  'Altar of Flame',
  'Bannerfall',
  'Bastion',
  'Blind Watch',
  'Cathedral of Dusk',
  'Cirrus Plaza',
  'Convergence',
  'Crossroads',
  'Disjunction',
  'Dissonance',
  "Emperor's Respite",
  'Endless Vale',
  'Eternity',
  'Eventide Labs',
  'Exodus Blue',
  'Firebase Delphi',
  'Firebase Echo',
  'First Light',
  'Frontier',
  "Gambler's Ruin",
  'Javelin-4',
  'Last Exit',
  "Legion's Gulch",
  'Meltdown',
  'Memento',
  'Midtown',
  'Multiplex',
  'Pacifica',
  'Pantheon',
  'Radiant Cliffs',
  'Retribution',
  'Rusted Lands',
  'Shores of Time',
  'Skyline',
  'Skyshock',
  'Solitude',
  'The Anomaly',
  'The Burning Shrine',
  'The Cauldron',
  'The Citadel',
  'The Drifter',
  'The Dungeons',
  'The Fortress',
  'The Timekeeper',
  'Twilight Gap',
  'Vertigo',
  'Vostok',
  'Wormhaven',
];

export const data = new SlashCommandBuilder()
  .setName('random-map')
  .setDescription('Pick a random Destiny 2 PvP map');

export async function execute(interaction) {
  const map = MAPS[Math.floor(Math.random() * MAPS.length)];

  const embed = new EmbedBuilder()
    .setColor(0x4a9eff)
    .setTitle('🗺️ Random PvP Map')
    .setDescription(`**${map}**`)
    .setFooter({ text: `1 of ${MAPS.length} maps` });

  await interaction.reply({ embeds: [embed] });
}
