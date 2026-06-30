import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { buildMatchData } from '../lib/comparator.js';
import { buildDimSearch } from '../lib/dimSearch.js';
import sessionStore from '../lib/sessionStore.js';

const MAX_INLINE_WEAPONS = 30;

export const data = new SlashCommandBuilder()
  .setName('compare-run')
  .setDescription('Compare all loaded files and show weapons that appear in all of them');

export async function execute(interaction) {
  await interaction.deferReply();

  const session = sessionStore.get(interaction.user.id);

  if (!session || session.files.length < 2) {
    return interaction.editReply(
      'You need at least 2 files loaded. Use `/compare-add` first.'
    );
  }

  const matchData = buildMatchData(session.files);
  session.matchData = matchData;
  session.lastLoadout = null;
  sessionStore.touch(interaction.user.id);

  const totalEntries = matchData.reduce((s, e) => s + e.total, 0);

  const embed = new EmbedBuilder()
    .setColor(0xc5a93e)
    .setTitle('Weapon Comparison Results')
    .addFields(
      { name: 'Files compared', value: String(session.files.length), inline: true },
      { name: 'Unique matches', value: String(matchData.length),      inline: true },
      { name: 'Total entries',  value: String(totalEntries),           inline: true },
    );

  const files = [];

  if (matchData.length === 0) {
    embed.setDescription('No weapons found in common across all files.');
  } else {
    const names = matchData.map(e => e.name);

    if (names.length <= MAX_INLINE_WEAPONS) {
      embed.setDescription(names.map(n => `• ${n}`).join('\n'));
    } else {
      // Too many to embed — send the first 30 inline and attach the full list as a file
      const preview = names.slice(0, MAX_INLINE_WEAPONS).map(n => `• ${n}`).join('\n');
      embed.setDescription(`${preview}\n_...and ${names.length - MAX_INLINE_WEAPONS} more (see attached file)_`);

      const fullList = names.join('\n');
      files.push(new AttachmentBuilder(Buffer.from(fullList), { name: 'matched-weapons.txt' }));
    }

    embed.setFooter({ text: 'Use /compare-loadout to roll a random loadout · /compare-dimsearch for DIM search' });
  }

  await interaction.editReply({ embeds: [embed], files });
}
