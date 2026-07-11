import { SlashCommandBuilder } from 'discord.js';
import chaosSession from '../lib/chaosSession.js';
import { buildClassOptInEmbed, buildClassOptInRow, buildRaidRollEmbed, buildRaidRollRow } from '../lib/chaosButtonHandler.js';
import { pickRandomRaid, shuffle } from '../lib/raidData.js';

const CLASSES = ['Titan', 'Hunter', 'Warlock'];

export const data = new SlashCommandBuilder()
  .setName('chaos-class')
  .setDescription('Record your class opt-in choice for the active Chaos Raid')
  .addStringOption(o =>
    o.setName('choice')
      .setDescription('Do you want a randomly assigned class?')
      .setRequired(true)
      .addChoices(
        { name: 'Yes — assign me a random class', value: 'yes' },
        { name: 'No — I will pick my own',        value: 'no'  },
      )
  );

export async function execute(interaction) {
  const guildId = interaction.guildId;
  const session = chaosSession.get(guildId);

  if (!session) {
    return interaction.reply({ content: 'No active chaos session found.', ephemeral: true });
  }
  if (session.phase !== 'class-opt-in') {
    return interaction.reply({ content: 'Class opt-in is not currently active.', ephemeral: true });
  }

  const player = session.players.find(p => p.userId === interaction.user.id);
  if (!player) {
    return interaction.reply({ content: "You're not in this session.", ephemeral: true });
  }
  if (player.wantsRandomClass !== null) {
    return interaction.reply({ content: 'You already responded!', ephemeral: true });
  }

  const wantsClass = interaction.options.getString('choice') === 'yes';
  player.wantsRandomClass = wantsClass;
  session.classOptInPending--;
  chaosSession.update(guildId, {});

  if (session.classOptInPending > 0) {
    return interaction.reply({
      content: `Got it! Waiting on ${session.classOptInPending} more player(s)…`,
      ephemeral: true,
    });
  }

  // All players answered — assign classes
  const optedIn = session.players.filter(p => p.wantsRandomClass);
  if (optedIn.length > 0) {
    const classPool = [];
    while (classPool.length < optedIn.length) classPool.push(...shuffle(CLASSES));
    optedIn.forEach((p, i) => { p.assignedClass = classPool[i]; });
  }

  const raid = pickRandomRaid();
  chaosSession.update(guildId, { phase: 'raid-roll', raid });

  await interaction.reply({
    content: 'All players have responded — rolling a raid!',
    embeds: [buildRaidRollEmbed(session)],
    components: [buildRaidRollRow(guildId, 0)],
  });
}
