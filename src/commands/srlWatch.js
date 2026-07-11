import { SlashCommandBuilder } from 'discord.js';
import { startRaceWatching, isRaceWatching } from '../lib/raceWatcher.js';
import { isLinked } from '../auth/tokenStore.js';

export const data = new SlashCommandBuilder()
  .setName('srl-watch')
  .setDescription('Watch for Sparrow Racing League private match results');

export async function execute(interaction) {
  const userId = interaction.user.id;

  if (!isLinked(userId)) {
    return interaction.reply({
      content: 'You need to link your Bungie account first. Run `/link-account`.',
      ephemeral: true,
    });
  }

  if (isRaceWatching(userId)) {
    return interaction.reply({
      content: 'Already watching for races! Use `/srl-stop` to stop.',
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    await startRaceWatching(userId, interaction.channel);
    await interaction.editReply({
      content: [
        '🏎️ **SRL Watch mode active.**',
        'When a Sparrow Racing private match finishes I\'ll post the results here.',
        '',
        'Results appear 1–3 minutes after the race ends.',
        'Use `/srl-stop` to stop watching.',
      ].join('\n'),
    });
  } catch (err) {
    if (err.message === 'no-link')       return interaction.editReply({ content: 'Account not linked. Run `/link-account` first.' });
    if (err.message === 'no-characters') return interaction.editReply({ content: 'No characters found on your Bungie account.' });
    console.error('[srl-watch]', err);
    return interaction.editReply({ content: 'Failed to start watching. Try again in a moment.' });
  }
}
