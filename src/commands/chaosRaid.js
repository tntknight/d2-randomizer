import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import chaosSession from '../lib/chaosSession.js';
import { pickRandomRaid } from '../lib/raidData.js';
import { buildRaidRollEmbed, buildRaidRollRow } from '../lib/chaosButtonHandler.js';

export const data = new SlashCommandBuilder()
  .setName('chaos-raid')
  .setDescription('Roll a random Destiny 2 raid — works standalone or as part of a Chaos Raid session');

export async function execute(interaction) {
  const guildId = interaction.guildId;
  const session = chaosSession.get(guildId);

  // Active session in raid-roll phase: reroll and update session state (host only)
  if (session && session.phase === 'raid-roll') {
    if (session.hostId !== interaction.user.id) {
      return interaction.reply({ content: 'Only the host can reroll the raid during a session.', ephemeral: true });
    }
    if (session.rerollsUsed >= chaosSession.MAX_REROLLS) {
      return interaction.reply({ content: 'Maximum rerolls reached.', ephemeral: true });
    }
    const newRaid = pickRandomRaid(session.raid?.id);
    chaosSession.update(guildId, { raid: newRaid, rerollsUsed: session.rerollsUsed + 1 });
    return interaction.reply({
      embeds: [buildRaidRollEmbed(session)],
      components: [buildRaidRollRow(guildId, session.rerollsUsed)],
    });
  }

  // Standalone: just pick a raid and display it with no session state
  const raid = pickRandomRaid();
  const encounterList = raid.encounters.map((e, i) => `${i + 1}. ${e.name}`).join('\n');

  const embed = new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle('Random Raid')
    .setDescription(`**${raid.name}**`)
    .addFields({ name: 'Encounters', value: encounterList })
    .setFooter({ text: 'Use /chaos-start to run a full chaos session with roles' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`chaos:quickroll:${guildId}`)
      .setLabel('Roll Again')
      .setStyle(ButtonStyle.Primary),
  );

  await interaction.reply({ embeds: [embed], components: [row] });
}
