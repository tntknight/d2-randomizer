import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAPS_DIR  = path.join(__dirname, '..', 'assets', 'maps');

// Reuse the same MAPS list from randomMap — import it to avoid duplication
import { MAPS } from './randomMap.js';

export const data = new SlashCommandBuilder()
  .setName('map-debug')
  .setDescription('(debug) Show all PvP maps and their images');

export async function execute(interaction) {
  await interaction.reply({ content: `Posting all ${MAPS.length} maps in batches…`, ephemeral: false });

  const BATCH = 5;
  for (let i = 0; i < MAPS.length; i += BATCH) {
    const batch   = MAPS.slice(i, i + BATCH);
    const embeds  = [];
    const files   = [];

    for (const map of batch) {
      const embed = new EmbedBuilder()
        .setColor(0x4a9eff)
        .setTitle(map.name);

      if (map.image) {
        const filePath = path.join(MAPS_DIR, map.image);
        if (fs.existsSync(filePath)) {
          files.push(new AttachmentBuilder(filePath, { name: map.image }));
          embed.setImage(`attachment://${map.image}`);
        } else {
          embed.setDescription(`⚠️ File not found: \`${map.image}\``);
        }
      } else {
        embed.setDescription('_No image set_');
      }

      embeds.push(embed);
    }

    await interaction.channel.send({ embeds, files });
  }
}
