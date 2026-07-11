import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { buildMatchData } from '../lib/comparator.js';
import { getIconUrl } from '../lib/bungieManifest.js';
import { buildDimSearch } from '../lib/dimSearch.js';
import sessionStore from '../lib/sessionStore.js';
import { SLOTS } from '../lib/loadoutPicker.js';

const SLOT_COLORS = { kineticslot: 0x9ba3af, energy: 0x4a9eff, power: 0xc5a93e };

function randFrom(arr) {
  return arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;
}

export const data = new SlashCommandBuilder()
  .setName('random-loadout')
  .setDescription('Roll a random weapon loadout from the server pool with one guaranteed exotic');

export async function execute(interaction) {
  await interaction.deferReply();

  if (!interaction.guildId) {
    return interaction.editReply('This command only works in a server.');
  }

  const session = sessionStore.get(interaction.guildId);
  if (!session || session.files.length === 0) {
    return interaction.editReply(
      'No weapons in the server pool. Use `/compare-add` to upload a DIM export first.'
    );
  }

  if (!session.matchData) {
    session.matchData = buildMatchData(session.files);
  }
  const pool = session.matchData;

  // Split by slot
  const bySlot = {};
  for (const { key } of SLOTS) {
    bySlot[key] = {
      exotic:    pool.filter(w => w.category === key && w.exotic),
      nonExotic: pool.filter(w => w.category === key && !w.exotic),
      all:       pool.filter(w => w.category === key),
    };
  }

  const allExotics = pool.filter(w => w.exotic);
  const picks = [];

  if (allExotics.length > 0) {
    // Guarantee exactly one exotic: pick it first, fill other slots with non-exotics
    const exotic     = randFrom(allExotics);
    const exoticSlot = exotic.category;

    for (const { key, label } of SLOTS) {
      if (key === exoticSlot) {
        picks.push({ slot: { key, label }, pick: exotic });
      } else {
        const fallback = bySlot[key].nonExotic.length
          ? bySlot[key].nonExotic
          : bySlot[key].all;
        picks.push({ slot: { key, label }, pick: randFrom(fallback) });
      }
    }
  } else {
    // No exotics in pool — pick anything per slot
    for (const { key, label } of SLOTS) {
      picks.push({ slot: { key, label }, pick: randFrom(bySlot[key].all) });
    }
  }

  const icons = await Promise.all(picks.map(p => getIconUrl(p.pick?.hash ?? null)));

  const embeds = picks.map(({ slot, pick }, i) => {
    const embed = new EmbedBuilder()
      .setColor(pick?.exotic ? 0xc5a93e : SLOT_COLORS[slot.key] ?? 0x1a1d26)
      .setTitle(slot.label);

    if (pick) {
      embed.setDescription(`**${pick.name}**${pick.exotic ? '  ✦ EXOTIC' : ''}\n${pick.type}`);
      if (icons[i]) embed.setThumbnail(icons[i]);
    } else {
      embed.setDescription('_No weapons in this slot_');
    }

    return embed;
  });

  embeds[embeds.length - 1].setFooter({ text: 'Run again to reroll' });

  const pickedWeapons = picks.map(p => p.pick).filter(Boolean);
  const dimSearch = buildDimSearch(pickedWeapons);
  const content = pickedWeapons.length
    ? `**DIM Search:**\n\`\`\`\n${dimSearch}\n\`\`\``
    : null;

  await interaction.editReply({ content, embeds });
}
