import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import sessionStore from '../lib/sessionStore.js';

export const data = new SlashCommandBuilder()
  .setName('compare-list')
  .setDescription('Show all files loaded in this server\'s pool');

export async function execute(interaction) {
  if (!interaction.guildId) {
    return interaction.reply({ content: 'This command only works in a server.', ephemeral: true });
  }

  const session = sessionStore.get(interaction.guildId);

  if (!session || session.files.length === 0) {
    return interaction.reply({
      content: 'No files loaded yet. Anyone can use `/compare-add` to upload their DIM export.',
      ephemeral: true,
    });
  }

  sessionStore.touch(interaction.guildId);

  const fileList = session.files
    .map(f => `• **${f.filename}** — ${f.weapons.length} weapons (${f.uploadedBy})`)
    .join('\n');

  const embed = new EmbedBuilder()
    .setColor(0x1a1d26)
    .setTitle(`Server pool — ${session.files.length} file${session.files.length !== 1 ? 's' : ''}`)
    .setDescription(fileList);

  if (session.matchData) {
    embed.addFields({ name: 'Last comparison', value: `${session.matchData.length} unique matches`, inline: true });
  }

  embed.setFooter({
    text: session.files.length >= 2
      ? 'Run /compare-loadout to roll a loadout.'
      : 'Need at least 2 files to compare.',
  });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
