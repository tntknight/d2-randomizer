import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { buildDimSearch } from '../lib/dimSearch.js';
import sessionStore from '../lib/sessionStore.js';

const MAX_INLINE_CHARS = 1800; // leave headroom under Discord's 2000 char limit

export const data = new SlashCommandBuilder()
  .setName('compare-dimsearch')
  .setDescription('Get a DIM search string for your matches or last loadout')
  .addStringOption(o =>
    o.setName('scope')
      .setDescription('Which weapons to include')
      .setRequired(true)
      .addChoices(
        { name: 'All matched weapons', value: 'all' },
        { name: 'Last loadout only',   value: 'loadout' },
      )
  );

export async function execute(interaction) {
  const scope   = interaction.options.getString('scope');
  const session = sessionStore.get(interaction.user.id);

  if (!session?.matchData) {
    return interaction.reply({
      content: 'No match data found. Run `/compare-run` first.',
      ephemeral: true,
    });
  }

  let weapons;
  if (scope === 'loadout') {
    if (!session.lastLoadout) {
      return interaction.reply({
        content: 'No loadout rolled yet. Run `/compare-loadout` first.',
        ephemeral: true,
      });
    }
    weapons = session.lastLoadout.map(p => p.pick).filter(Boolean);
  } else {
    weapons = session.matchData;
  }

  sessionStore.touch(interaction.user.id);

  const searchStr = buildDimSearch(weapons);

  if (searchStr.length <= MAX_INLINE_CHARS) {
    await interaction.reply({ content: `\`\`\`\n${searchStr}\n\`\`\``, ephemeral: true });
  } else {
    // Too long for a message — send as a text file
    const file = new AttachmentBuilder(Buffer.from(searchStr), { name: 'dim-search.txt' });
    await interaction.reply({
      content: 'Search string is too long to display — here it is as a file:',
      files: [file],
      ephemeral: true,
    });
  }
}
