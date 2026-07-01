import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { fetchWeapons } from '../lib/bungieVault.js';
import sessionStore from '../lib/sessionStore.js';

export const data = new SlashCommandBuilder()
  .setName('load-vault')
  .setDescription("Fetch your Destiny 2 vault and add your weapons to this server's pool");

export async function execute(interaction) {
  if (!interaction.guildId) {
    return interaction.reply({ content: 'This command only works in a server.', ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  let result;
  try {
    result = await fetchWeapons(interaction.user.id);
  } catch (err) {
    if (err.message === 'no-link') {
      return interaction.editReply({
        content: "You haven't linked your Bungie account yet. Run `/link-account` first.",
      });
    }
    if (err.message === 'refresh-failed') {
      return interaction.editReply({
        content: 'Your Bungie session has expired. Run `/link-account` to re-link.',
      });
    }
    console.error('[load-vault] Error:', err);
    return interaction.editReply({
      content: 'Failed to fetch your vault from Bungie. Try again in a moment.',
    });
  }

  const { weapons, displayName } = result;
  const session = sessionStore.getOrCreate(interaction.guildId);

  // Replace this user's previously loaded vault (by username) with the fresh fetch
  session.files     = session.files.filter(f => f.uploadedBy !== interaction.user.username);
  session.matchData = null;
  session.lastLoadout = null;

  session.files.push({
    filename:   `${displayName}'s vault`,
    weapons,
    uploadedBy: interaction.user.username,
  });

  sessionStore.touch(interaction.guildId);

  const embed = new EmbedBuilder()
    .setColor(0x1a1d26)
    .addFields({ name: '✅ Vault loaded', value: `**${displayName}** — ${weapons.length} weapons` });

  if (session.files.length >= 2) {
    const fileList = session.files
      .map(f => `• ${f.filename} — ${f.weapons.length} weapons (${f.uploadedBy})`)
      .join('\n');
    embed.addFields({ name: `📂 Server pool (${session.files.length} players)`, value: fileList });
    embed.setFooter({ text: 'Run /compare-loadout to roll a loadout from shared weapons.' });
  } else {
    embed.setFooter({ text: 'Waiting for more players to run /load-vault.' });
  }

  await interaction.editReply({ embeds: [embed] });
}
