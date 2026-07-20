import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { fetchEquippedAppearance } from '../lib/bungieEquipped.js';

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

  const linkOrName = (item) => item.iconUrl ? `[${item.name}](${item.iconUrl})` : item.name;

  // Discord only groups embeds into an image gallery when they share the same
  // non-empty `url`, and stacking every item as its own embed shows each icon
  // at full size instead of the single tiny thumbnail an embed normally allows.
  const galleryUrl = (userId) => `https://verity-appearances.local/${userId}`;

  try {
    const perUserEmbeds = await Promise.all(users.map(async (user) => {
      const displayName = interaction.guild
        ? (await interaction.guild.members.fetch(user.id).catch(() => null))?.displayName ?? user.username
        : user.username;

      try {
        const a = await fetchEquippedAppearance(user.id);
        const url = galleryUrl(user.id);

        const mainEmbed = new EmbedBuilder()
          .setColor(0x9b59b6)
          .setTitle(displayName)
          .setURL(url)
          .setDescription('Order: Ghost, Helmet, Arms, Chest, Legs, Class Item')
          .addFields(
            { name: 'Ghost',      value: linkOrName(a.ghost),     inline: true },
            { name: 'Helmet',     value: linkOrName(a.helmet),    inline: true },
            { name: 'Arms',       value: linkOrName(a.gauntlets), inline: true },
            { name: 'Chest',      value: linkOrName(a.chest),     inline: true },
            { name: 'Legs',       value: linkOrName(a.legs),      inline: true },
            { name: 'Class Item', value: linkOrName(a.classItem), inline: true },
          );

        const imageEmbeds = [a.ghost, a.helmet, a.gauntlets, a.chest, a.legs, a.classItem]
          .filter(item => item.iconUrl)
          .map(item => new EmbedBuilder().setURL(url).setImage(item.iconUrl));

        return [mainEmbed, ...imageEmbeds];
      } catch (err) {
        return [
          new EmbedBuilder()
            .setColor(0x95a5a6)
            .setTitle(displayName)
            .setDescription(
              err.message === 'no-link'
                ? 'Bungie account not linked — run `/link-account` to connect.'
                : 'Could not fetch appearance data.'
            ),
        ];
      }
    }));

    const [firstEmbeds, ...restEmbeds] = perUserEmbeds;
    await interaction.editReply({ embeds: firstEmbeds });
    for (const embeds of restEmbeds) {
      await interaction.followUp({ embeds });
    }
  } catch (err) {
    console.error('[verity-appearances] Error:', err);
    await interaction.editReply({ content: 'Failed to fetch appearance data. Try again in a moment.' });
  }
}
