import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { buildMatchData } from '../lib/comparator.js';
import { getIconUrl, getWeaponDef } from '../lib/bungieManifest.js';
import { buildDimSearch } from '../lib/dimSearch.js';
import { fetchWeapons } from '../lib/bungieVault.js';
import { getTokens } from '../auth/tokenStore.js';
import sessionStore from '../lib/sessionStore.js';
import { SLOTS } from '../lib/loadoutPicker.js';

const SLOT_COLORS = { kineticslot: 0x9ba3af, energy: 0x4a9eff, power: 0xc5a93e };

function randFrom(arr) {
  return arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;
}

export const data = new SlashCommandBuilder()
  .setName('random-loadout')
  .setDescription('Roll a random weapon loadout — uses server pool if loaded, otherwise your linked vault');

export async function execute(interaction) {
  await interaction.deferReply();

  if (!interaction.guildId) {
    return interaction.editReply('This command only works in a server.');
  }

  let pool;
  const session = sessionStore.get(interaction.guildId);

  if (session?.files?.length > 0) {
    // Use shared server pool
    if (!session.matchData) session.matchData = buildMatchData(session.files);
    pool = session.matchData;
  } else {
    // Fall back to the caller's linked vault
    const tokens = getTokens(interaction.user.id);
    if (!tokens) {
      return interaction.editReply(
        'No weapons in the server pool and no linked Bungie account found.\n' +
        'Run `/load-vault` or `/compare-add` to load weapons, or `/link-account` to link your account.'
      );
    }
    try {
      const { weapons } = await fetchWeapons(interaction.user.id);
      pool = weapons;
    } catch (err) {
      if (err.message === 'refresh-failed') {
        return interaction.editReply('Your Bungie session expired. Run `/link-account` to re-link.');
      }
      throw err;
    }
  }

  // Normalize exotic flag — matchData uses boolean `exotic`, vault weapons use rarity string
  const isExotic = w => w.exotic === true || w.rarity === 'exotic';

  // Split by slot
  const bySlot = {};
  for (const { key } of SLOTS) {
    bySlot[key] = {
      exotic:    pool.filter(w => w.category === key && isExotic(w)),
      nonExotic: pool.filter(w => w.category === key && !isExotic(w)),
      all:       pool.filter(w => w.category === key),
    };
  }

  const allExotics = pool.filter(w => isExotic(w));
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

  // Fetch icons and authoritative manifest defs in parallel
  const [icons, defs] = await Promise.all([
    Promise.all(picks.map(p => getIconUrl(p.pick?.hash ?? null))),
    Promise.all(picks.map(p => getWeaponDef(p.pick?.hash ?? null))),
  ]);

  const embeds = picks.map(({ slot, pick }, i) => {
    const embed = new EmbedBuilder()
      .setColor(pick?.exotic ? 0xc5a93e : SLOT_COLORS[slot.key] ?? 0x1a1d26)
      .setTitle(slot.label);

    if (pick) {
      // Use manifest type as authoritative source; fall back to stored type
      const type = defs[i]?.type ?? pick.type;
      embed.setDescription(`**${pick.name}**${pick.exotic ? '  ✦ EXOTIC' : ''}\n${type}`);
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
