import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAPS_DIR  = path.join(__dirname, '..', 'assets', 'maps');

export const MAPS = [
  { name: 'Altar of Flame',      image: "Altar_of_Flame.webp" },
  { name: 'The Anomaly',         image: "the_anomaly.jpg" },
  { name: 'Bannerfall',          image: "bannerfall.png" },
  { name: 'The Burnout',         image: "the_burnout.jpg" },
  { name: 'Cathedral of Dusk',   image: "Cathedral_of_Dusk.webp" },
  { name: 'Cauldron',            image: "cauldron.jpg" },
  { name: 'The Citadel',         image: "the_citadel.jpg" },
  { name: 'Cirrus Plaza',        image: "Cirrus_Plaza.webp" },
  { name: 'Convergence',         image: "Convergence.webp" },
  { name: 'The Dead Cliffs',     image: "Dead-cliffs.jpg" },
  { name: 'Disjunction',         image: "Disjunction.webp" },
  { name: 'Dissonance',          image: "Dissonance.webp" },
  { name: 'Endless Vale',        image: "Endless_Vale.webp" },
  { name: 'Eternity',            image: "Eternity.jpg" },
  { name: 'Eventide Labs',       image: "Eventide_Labs.webp" },
  { name: 'Exodus Blue',         image: "exodus_blue.jpg" },
  { name: 'The Fortress',        image: "the_fortress.jpg" },
  { name: 'Fragment',            image: "Fragment.jpg" },
  //{ name: 'Firebase Echo',       image: "FireBase_Echo.webp" },
  { name: 'Javelin-4',           image: "Javelin-4.webp" },
  { name: "Midtown",             image: "midtown.webp" },
  { name: 'Meltdown',            image: "Meltdown.webp" },
  { name: 'Multiplex',           image: "Multiplex.webp" },
  { name: 'Pacifica',            image: "Pacifica.webp" },
  { name: 'Radiant Cliffs',      image: "Radiant_Cliffs.webp" },
  { name: 'Rusted Lands',        image: "Rusted_Lands.webp" },
  { name: 'Twilight Gap',        image: "twilight_gap.jpg" },
  { name: 'Vostok',              image: "vostok.jpg" },
  { name: 'Widows Court',        image: "Widows_court.webp" },
  { name: 'Wormhaven',           image: "Wormhaven.webp" },
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
