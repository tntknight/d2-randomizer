import { SlashCommandBuilder } from 'discord.js';
import chaosSession from '../lib/chaosSession.js';
import { buildEncounterEmbed, buildEncounterRow } from '../lib/chaosButtonHandler.js';

export const data = new SlashCommandBuilder()
  .setName('encounter')
  .setDescription('Show an encounter with randomly assigned roles for each player')
  .addIntegerOption(o =>
    o.setName('number')
      .setDescription('Encounter number to jump to (default: current encounter)')
      .setRequired(false)
      .setMinValue(1)
  );

export async function execute(interaction) {
  const guildId = interaction.guildId;
  const session = chaosSession.get(guildId);

  if (!session || session.phase !== 'encounter') {
    return interaction.reply({
      content: 'No active encounter. Run `/raid` or `/dungeon` and keep one first.',
      ephemeral: true,
    });
  }

  const total = session.raid.encounters.length;
  const requestedNum = interaction.options.getInteger('number');

  if (requestedNum !== null) {
    if (requestedNum > total) {
      return interaction.reply({
        content: `That raid only has ${total} encounter(s).`,
        ephemeral: true,
      });
    }
    chaosSession.update(guildId, { currentEncounterIndex: requestedNum - 1 });
  }

  const isLast = session.currentEncounterIndex === session.raid.encounters.length - 1;
  const { embed } = buildEncounterEmbed(session);
  await interaction.reply({ embeds: [embed], components: [buildEncounterRow(guildId, isLast, session.raid.encounters[session.currentEncounterIndex].name)] });
}
