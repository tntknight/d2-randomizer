import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getExoticArmor } from '../lib/bungieManifest.js';
import { getMostRecentCharacterClass } from '../lib/bungieActivity.js';
import { getTokens } from '../auth/tokenStore.js';

const CLASS_NAMES  = { 0: 'Titan', 1: 'Hunter', 2: 'Warlock' };
const CLASS_COLORS = { 0: 0xe8a838, 1: 0x4a9eff, 2: 0x9b59b6 };

export const data = new SlashCommandBuilder()
  .setName('random-exotic')
  .setDescription('Pick a random exotic armor piece — defaults to your current class if your account is linked')
  .addStringOption(o =>
    o.setName('class')
      .setDescription('Override the class to pick for')
      .setRequired(false)
      .addChoices(
        { name: 'Titan',   value: '0' },
        { name: 'Hunter',  value: '1' },
        { name: 'Warlock', value: '2' },
      )
  );

export async function execute(interaction) {
  const raw = interaction.options.getString('class');
  let classType = parseClass(raw);

  // No class chosen — try to infer from linked account
  if (classType === null) {
    const tokens = getTokens(interaction.user.id);
    if (tokens) {
      classType = await getMostRecentCharacterClass(tokens.membershipType, tokens.membershipId);
    }
  }

  if (classType === null) {
    return interaction.reply({
      content: 'No class selected and no linked account found.\nPick a class with the `class` option, or run `/link-account` first.',
      ephemeral: true,
    });
  }

  await interaction.deferReply();

  const armor = await getExoticArmor(classType);

  if (!armor.length) {
    return interaction.editReply(
      `No exotic armor found for ${CLASS_NAMES[classType]}. The manifest may still be loading — try again in a moment.`
    );
  }

  const pick      = armor[Math.floor(Math.random() * armor.length)];
  const className = CLASS_NAMES[classType];

  const embed = new EmbedBuilder()
    .setColor(CLASS_COLORS[classType] ?? 0xc5a93e)
    .setTitle(`✨ Random Exotic — ${className}`)
    .setDescription(`**${pick.name}**\n${pick.slot}`)
    .setFooter({ text: `${armor.length} exotic armor pieces in pool for ${className}` });

  if (pick.iconUrl) embed.setThumbnail(pick.iconUrl);

  await interaction.editReply({ embeds: [embed] });
}

// Accepts slash choice values ('0','1','2') or plain text ('Titan','Hunter','Warlock')
// for prefix command compatibility
function parseClass(val) {
  if (val == null) return null;
  switch (val.toLowerCase().trim()) {
    case '0': case 'titan':   return 0;
    case '1': case 'hunter':  return 1;
    case '2': case 'warlock': return 2;
    default: return null;
  }
}
