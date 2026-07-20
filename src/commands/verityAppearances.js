import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { fetchEquippedAppearance } from '../lib/bungieEquipped.js';
import { buildPlayerGridImage } from '../lib/armorImage.js';

export const data = new SlashCommandBuilder()
  .setName('verity-appearances')
  .setDescription("Show each player's equipped ghost and armor for Verity statue identification")
  .addUserOption(o => o.setName('player1').setDescription('First player').setRequired(true))
  .addUserOption(o => o.setName('player2').setDescription('Second player').setRequired(false))
  .addUserOption(o => o.setName('player3').setDescription('Third player').setRequired(false))
  .addUserOption(o => o.setName('player4').setDescription('Fourth player').setRequired(false))
  .addUserOption(o => o.setName('player5').setDescription('Fifth player').setRequired(false))
  .addUserOption(o => o.setName('player6').setDescription('Sixth player').setRequired(false));

export async function execute(interaction) {
  const users = ['player1', 'player2', 'player3', 'player4', 'player5', 'player6']
    .map(k => interaction.options.getUser(k))
    .filter(Boolean);

  await interaction.deferReply();

  try {
    const results = await Promise.all(users.map(async (user) => {
      const displayName = interaction.guild
        ? (await interaction.guild.members.fetch(user.id).catch(() => null))?.displayName ?? user.username
        : user.username;

      try {
        const a = await fetchEquippedAppearance(user.id);
        const items = [a.ghost, a.helmet, a.gauntlets, a.chest, a.legs, a.classItem];
        return { name: displayName, items, error: null };
      } catch (err) {
        return {
          name: displayName,
          items: null,
          error: err.message === 'no-link'
            ? 'Bungie account not linked — run `/link-account` to connect.'
            : 'Could not fetch appearance data.',
        };
      }
    }));

    const players = results.filter(r => r.items);
    const failed = results.filter(r => !r.items);

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle('Verity Appearances')
      .setDescription(
        'Rows top to bottom: Ghost, Helmet, Arms, Chest, Legs, Class Item'
        + (failed.length ? `\n\n${failed.map(f => `⚠️ **${f.name}** — ${f.error}`).join('\n')}` : '')
      );

    const files = [];
    if (players.length > 0) {
      const imageBuffer = await buildPlayerGridImage(players);
      if (imageBuffer) {
        const filename = 'verity-appearances.png';
        files.push(new AttachmentBuilder(imageBuffer, { name: filename }));
        embed.setImage(`attachment://${filename}`);
      }
    }

    await interaction.editReply({ embeds: [embed], files });
  } catch (err) {
    console.error('[verity-appearances] Error:', err);
    await interaction.editReply({ content: 'Failed to fetch appearance data. Try again in a moment.' });
  }
}
