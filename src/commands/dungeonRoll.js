import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import chaosSession from '../lib/chaosSession.js';
import { pickRandomDungeon } from '../lib/dungeonData.js';
import { buildRaidRollEmbed, buildRaidRollRow } from '../lib/chaosButtonHandler.js';

export const data = new SlashCommandBuilder()
  .setName('dungeon')
  .setDescription('Roll a random Destiny 2 dungeon — works standalone or as part of a Dungeon session');

export async function execute(interaction) {
  const guildId = interaction.guildId;
  const session = chaosSession.get(guildId);

  // Active dungeon session in raid-roll phase: reroll (host only)
  if (session && session.type === 'dungeon' && session.phase === 'raid-roll') {
    if (session.hostId !== interaction.user.id) {
      return interaction.reply({ content: 'Only the host can reroll the dungeon during a session.', ephemeral: true });
    }
    if (session.rerollsUsed >= chaosSession.MAX_REROLLS) {
      return interaction.reply({ content: 'Maximum rerolls reached.', ephemeral: true });
    }
    const newDungeon = pickRandomDungeon(session.raid?.id);
    chaosSession.update(guildId, { raid: newDungeon, rerollsUsed: session.rerollsUsed + 1 });
    return interaction.reply({
      embeds: [buildRaidRollEmbed(session)],
      components: [buildRaidRollRow(guildId, session.rerollsUsed)],
    });
  }

  // Standalone: pick a random dungeon and display it
  const dungeon = pickRandomDungeon();
  const encounterList = dungeon.encounters.map((e, i) => `${i + 1}. ${e.name}`).join('\n');

  const embed = new EmbedBuilder()
    .setColor(0x1abc9c)
    .setTitle('Random Dungeon')
    .setDescription(`**${dungeon.name}**`)
    .addFields({ name: 'Encounters', value: encounterList })
    .setFooter({ text: 'Use /dungeon-start to run a full dungeon session with roles' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`chaos:quickdungeon:${guildId}:${interaction.user.id}`)
      .setLabel('Roll Again')
      .setStyle(ButtonStyle.Primary),
  );

  await interaction.reply({ embeds: [embed], components: [row] });
}
