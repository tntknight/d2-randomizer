import { SlashCommandBuilder } from 'discord.js';
import { startWatching, isWatching } from '../lib/matchWatcher.js';
import { isLinked } from '../auth/tokenStore.js';

export const data = new SlashCommandBuilder()
  .setName('pvp-watch')
  .setDescription('Start watching for your PvP match results — posts scoreboard and rolls a loadout after each match');

export async function execute(interaction) {
  const userId = interaction.user.id;

  if (!isLinked(userId)) {
    return interaction.reply({
      content: "You need to link your Bungie account first. Run `/link-account`.",
      ephemeral: true,
    });
  }

  if (isWatching(userId)) {
    return interaction.reply({
      content: 'Already watching your matches in this channel. Use `/pvp-stop` to stop.',
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    await startWatching(userId, interaction.channel, interaction.guildId);
    await interaction.editReply({
      content: [
        '👁️ **Watch mode active.**',
        'When a PvP match finishes I\'ll post the scoreboard here and roll a loadout for your next match.',
        '',
        'Note: results appear 1–3 minutes after the match ends (Bungie\'s PGCR takes a moment to be ready).',
        'Use `/pvp-stop` to stop watching.',
        '_Watch mode resets if the bot restarts — just run `/pvp-watch` again._',
      ].join('\n'),
    });
  } catch (err) {
    if (err.message === 'no-link') {
      return interaction.editReply({ content: 'Account not linked. Run `/link-account` first.' });
    }
    if (err.message === 'no-characters') {
      return interaction.editReply({ content: 'No characters found on your Bungie account.' });
    }
    console.error('[pvp-watch]', err);
    return interaction.editReply({ content: 'Failed to start watching. Try again in a moment.' });
  }
}
