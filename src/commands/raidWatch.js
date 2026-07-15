import { SlashCommandBuilder } from 'discord.js';
import { startRaidWatching, isRaidWatching } from '../lib/raidWatcher.js';
import { isLinked } from '../auth/tokenStore.js';

export const data = new SlashCommandBuilder()
  .setName('raid-watch')
  .setDescription('Watch for raid completions — posts a results summary after each raid');

export async function execute(interaction) {
  const userId = interaction.user.id;

  if (!isLinked(userId)) {
    return interaction.reply({
      content: 'You need to link your Bungie account first. Run `/link-account`.',
      ephemeral: true,
    });
  }

  if (isRaidWatching(userId)) {
    return interaction.reply({
      content: 'Already watching for raids! Use `/raid-stop` to stop.',
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    await startRaidWatching(userId, interaction.channel);
    await interaction.editReply({
      content: [
        '🏰 **Raid Watch mode active.**',
        "When a raid ends I'll post the results here.",
        '',
        'Results appear 1–3 minutes after the raid ends.',
        'Use `/raid-stop` to stop watching.',
        '_Watch mode resets if the bot restarts — just run `/raid-watch` again._',
      ].join('\n'),
    });
  } catch (err) {
    if (err.message === 'no-link')       return interaction.editReply({ content: 'Account not linked. Run `/link-account` first.' });
    if (err.message === 'no-characters') return interaction.editReply({ content: 'No characters found on your Bungie account.' });
    console.error('[raid-watch]', err);
    return interaction.editReply({ content: 'Failed to start watching. Try again in a moment.' });
  }
}
