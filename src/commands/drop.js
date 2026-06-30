import { SlashCommandBuilder } from 'discord.js';
import sessionStore from '../lib/sessionStore.js';

export const data = new SlashCommandBuilder()
  .setName('compare-drop')
  .setDescription('Remove a file from the server pool, or clear all files')
  .addStringOption(o =>
    o.setName('filename')
      .setDescription('File to remove (leave blank to remove all)')
      .setRequired(false)
  );

export async function execute(interaction) {
  if (!interaction.guildId) {
    return interaction.reply({ content: 'This command only works in a server.', ephemeral: true });
  }

  const session = sessionStore.get(interaction.guildId);

  if (!session || session.files.length === 0) {
    return interaction.reply({ content: 'No files are loaded in this server.', ephemeral: true });
  }

  const filename = interaction.options.getString('filename');

  if (!filename) {
    const count = session.files.length;
    session.files       = [];
    session.matchData   = null;
    session.lastLoadout = null;
    sessionStore.touch(interaction.guildId);
    return interaction.reply({
      content: `Removed all ${count} file${count !== 1 ? 's' : ''} from the server pool.`,
      ephemeral: true,
    });
  }

  const before = session.files.length;
  session.files = session.files.filter(f => f.filename !== filename);

  if (session.files.length === before) {
    const names = session.files.map(f => `• ${f.filename}`).join('\n');
    return interaction.reply({
      content: `No file named \`${filename}\` found. Loaded files:\n${names}`,
      ephemeral: true,
    });
  }

  session.matchData   = null;
  session.lastLoadout = null;
  sessionStore.touch(interaction.guildId);

  const remaining = session.files.length;
  const summary = remaining > 0
    ? `Remaining files:\n${session.files.map(f => `• ${f.filename} (${f.uploadedBy})`).join('\n')}`
    : 'No files remaining.';

  await interaction.reply({
    content: `Removed \`${filename}\`.\n${summary}`,
    ephemeral: true,
  });
}
