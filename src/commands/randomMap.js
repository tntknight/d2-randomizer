import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAPS_DIR  = path.join(__dirname, '..', 'assets', 'maps');

const MAPS = [
  { name: 'Altar of Flame',      image: null },
  { name: 'Bannerfall',          image: null },
  { name: 'Bastion',             image: null },
  { name: 'Blind Watch',         image: null },
  { name: 'Cathedral of Dusk',   image: null },
  { name: 'Cirrus Plaza',        image: null },
  { name: 'Convergence',         image: null },
  { name: 'Crossroads',          image: null },
  { name: 'Disjunction',         image: null },
  { name: 'Dissonance',          image: null },
  { name: "Emperor's Respite",   image: null },
  { name: 'Endless Vale',        image: null },
  { name: 'Eternity',            image: null },
  { name: 'Eventide Labs',       image: null },
  { name: 'Exodus Blue',         image: null },
  { name: 'Firebase Delphi',     image: null },
  { name: 'Firebase Echo',       image: null },
  { name: 'First Light',         image: null },
  { name: 'Frontier',            image: null },
  { name: "Gambler's Ruin",      image: null },
  { name: 'Javelin-4',           image: null },
  { name: 'Last Exit',           image: null },
  { name: "Legion's Gulch",      image: null },
  { name: 'Meltdown',            image: null },
  { name: 'Memento',             image: null },
  { name: 'Midtown',             image: null },
  { name: 'Multiplex',           image: null },
  { name: 'Pacifica',            image: null },
  { name: 'Pantheon',            image: null },
  { name: 'Radiant Cliffs',      image: null },
  { name: 'Retribution',         image: null },
  { name: 'Rusted Lands',        image: null },
  { name: 'Shores of Time',      image: null },
  { name: 'Skyline',             image: null },
  { name: 'Skyshock',            image: null },
  { name: 'Solitude',            image: null },
  { name: 'The Anomaly',         image: null },
  { name: 'The Burning Shrine',  image: null },
  { name: 'The Cauldron',        image: null },
  { name: 'The Citadel',         image: null },
  { name: 'The Drifter',         image: null },
  { name: 'The Dungeons',        image: null },
  { name: 'The Fortress',        image: null },
  { name: 'The Timekeeper',      image: null },
  { name: 'Twilight Gap',        image: null },
  { name: 'Vertigo',             image: null },
  { name: 'Vostok',              image: null },
  { name: 'Wormhaven',           image: null },
];

export const data = new SlashCommandBuilder()
  .setName('random-map')
  .setDescription('Pick a random Destiny 2 PvP map');

export async function execute(interaction) {
  const map = MAPS[Math.floor(Math.random() * MAPS.length)];

  const embed = new EmbedBuilder()
    .setColor(0x4a9eff)
    .setTitle('🗺️ Random PvP Map')
    .setDescription(`**${map.name}**`)
    .setFooter({ text: `1 of ${MAPS.length} maps` });

  if (map.image) {
    const file = new AttachmentBuilder(path.join(MAPS_DIR, map.image));
    embed.setImage(`attachment://${map.image}`);
    return interaction.reply({ embeds: [embed], files: [file] });
  }

  await interaction.reply({ embeds: [embed] });
}
