import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { pickLoadout } from '../lib/loadoutPicker.js';
import { buildMatchData } from '../lib/comparator.js';
import { getIconUrl, getWeaponDef } from '../lib/bungieManifest.js';
import { buildDimSearch } from '../lib/dimSearch.js';
import sessionStore from '../lib/sessionStore.js';

const SLOT_COLORS = {
  kineticslot: 0x9ba3af,
  energy:      0x4a9eff,
  power:       0xc5a93e,
};

export const data = new SlashCommandBuilder()
  .setName('compare-loadout')
  .setDescription('Roll a random loadout from your matched weapons');

export async function execute(interaction) {
  await interaction.deferReply();

  if (!interaction.guildId) {
    return interaction.editReply('This command only works in a server.');
  }

  const session = sessionStore.get(interaction.guildId);

  if (!session || session.files.length < 2) {
    return interaction.editReply('Need at least 2 files in the server pool. Ask your group to use `/compare-add`.');
  }

  // Auto-run compare if it hasn't been run yet
  if (!session.matchData) {
    session.matchData = buildMatchData(session.files);
  }

  const picks = pickLoadout(session.matchData);
  session.lastLoadout = picks;
  sessionStore.touch(interaction.guildId);

  // Fetch icons and authoritative manifest defs in parallel
  const [icons, defs] = await Promise.all([
    Promise.all(picks.map(p => getIconUrl(p.pick?.hash ?? null))),
    Promise.all(picks.map(p => getWeaponDef(p.pick?.hash ?? null))),
  ]);

  // One embed per slot — each can have its own thumbnail for the weapon icon
  const embeds = picks.map(({ slot, pick }, i) => {
    const embed = new EmbedBuilder()
      .setColor(pick?.exotic ? 0xc5a93e : SLOT_COLORS[slot.key] ?? 0x1a1d26)
      .setTitle(slot.label);

    if (pick) {
      // Use manifest type as authoritative source; fall back to stored type
      const type = defs[i]?.type ?? pick.type;
      embed.setDescription(
        `**${pick.name}**${pick.exotic ? '  ✦ EXOTIC' : ''}\n${type}`
      );
      if (icons[i]) embed.setThumbnail(icons[i]);
    } else {
      embed.setDescription('_No matches in this slot_');
    }

    return embed;
  });

  // Footer on the last embed only
  embeds[embeds.length - 1].setFooter({ text: 'Run again to reroll' });

  // Build DIM search string for the loadout weapons
  const pickedWeapons = picks.map(p => p.pick).filter(Boolean);
  const dimSearch = buildDimSearch(pickedWeapons);
  const content = pickedWeapons.length
    ? `**DIM Search:**\n\`\`\`\n${dimSearch}\n\`\`\``
    : null;

  await interaction.editReply({ content, embeds });
}
