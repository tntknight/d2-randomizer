import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const CLASSES = [
  { name: 'Titan',   color: 0xe8a838, emoji: '🛡️' },
  { name: 'Hunter',  color: 0x4a9eff, emoji: '🗡️' },
  { name: 'Warlock', color: 0x9b59b6, emoji: '✨' },
];

export const data = new SlashCommandBuilder()
  .setName('roll-class')
  .setDescription('Roll a random Destiny 2 class');

export async function execute(interaction) {
  const cls = CLASSES[Math.floor(Math.random() * CLASSES.length)];
  const guildId = interaction.guildId;

  const embed = new EmbedBuilder()
    .setColor(cls.color)
    .setTitle(`${cls.emoji} ${cls.name}`)
    .setDescription(`${interaction.member?.displayName ?? interaction.user.username} rolled **${cls.name}**`);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`rollclass:reroll:${guildId}:${interaction.user.id}`)
      .setLabel('Reroll')
      .setStyle(ButtonStyle.Secondary),
  );

  await interaction.reply({ embeds: [embed], components: [row] });
}
