import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getAllWeapons } from '../lib/bungieManifest.js';
import { buildDimSearch } from '../lib/dimSearch.js';

const SLOTS = ['kineticslot', 'energy', 'power'];
const SLOT_LABEL = { kineticslot: 'Kinetic', energy: 'Energy', power: 'Power' };
const SLOT_EMOJI = { kineticslot: '🔫', energy: '⚡', power: '💥' };

export const data = new SlashCommandBuilder()
  .setName('random-loadout')
  .setDescription('Roll a random weapon loadout with one exotic');

export async function execute(interaction) {
  await interaction.deferReply();

  const all = await getAllWeapons();
  if (!all.length) {
    return interaction.editReply('Manifest still loading — try again in a moment.');
  }

  // Group by slot
  const bySlot = {};
  for (const slot of SLOTS) {
    bySlot[slot] = {
      exotic:    all.filter(w => w.category === slot && w.rarity === 'exotic'),
      legendary: all.filter(w => w.category === slot && w.rarity === 'legendary'),
    };
  }

  // Pick one random exotic from ANY slot
  const allExotics = all.filter(w => w.rarity === 'exotic');
  if (!allExotics.length) {
    return interaction.editReply('No exotic weapons found in manifest.');
  }
  const exotic     = allExotics[Math.floor(Math.random() * allExotics.length)];
  const exoticSlot = exotic.category;

  // Fill remaining slots with random legendaries (fall back to whole pool if empty)
  const picks = { [exoticSlot]: exotic };
  for (const slot of SLOTS) {
    if (slot === exoticSlot) continue;
    const pool = bySlot[slot].legendary.length
      ? bySlot[slot].legendary
      : all.filter(w => w.category === slot);
    picks[slot] = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  }

  const fields = SLOTS.map(slot => {
    const w = picks[slot];
    if (!w) return { name: `${SLOT_EMOJI[slot]} ${SLOT_LABEL[slot]}`, value: '*Nothing found*', inline: false };
    const label = w.rarity === 'exotic' ? `✨ **${w.name}**` : `**${w.name}**`;
    return {
      name:   `${SLOT_EMOJI[slot]} ${SLOT_LABEL[slot]}`,
      value:  `${label}\n${w.type}`,
      inline: false,
    };
  });

  const dimQuery = buildDimSearch(SLOTS.map(s => picks[s]).filter(Boolean));

  const embed = new EmbedBuilder()
    .setColor(0xc5a93e)
    .setTitle('🎲 Random Loadout')
    .addFields(fields)
    .addFields({ name: 'DIM Search', value: `\`\`\`${dimQuery}\`\`\``, inline: false });

  await interaction.editReply({ embeds: [embed] });
}
