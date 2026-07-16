import { SlashCommandBuilder } from 'discord.js';
import chaosSession from '../lib/chaosSession.js';
import { buildEncounterEmbed, buildEncounterRow } from '../lib/chaosButtonHandler.js';

export const data = new SlashCommandBuilder()
  .setName('chaos-roles')
  .setDescription('Reroll roles for the current encounter without advancing to the next one');

export async function execute(interaction) {
  const guildId = interaction.guildId;
  const session = chaosSession.get(guildId);

  if (!session || session.phase !== 'encounter') {
    return interaction.reply({
      content: 'No active encounter. Run `/raid` or `/dungeon` and keep one first.',
      ephemeral: true,
    });
  }

  if (!session.players.some(p => p.userId === interaction.user.id)) {
    return interaction.reply({ content: "You're not in this session.", ephemeral: true });
  }

  chaosSession.update(guildId, {});

  const isLast = session.currentEncounterIndex === session.raid.encounters.length - 1;
  const { embed } = buildEncounterEmbed(session);
  await interaction.reply({ embeds: [embed], components: [buildEncounterRow(guildId, isLast, session.raid.encounters[session.currentEncounterIndex].name)] });
}
