import { SlashCommandBuilder } from 'discord.js';
import { getTokens, isLinked } from '../auth/tokenStore.js';
import { getCharacterIds, getLatestActivityByMode, getPGCR } from '../lib/bungieActivity.js';
import { postRaidResult } from '../lib/raidWatcher.js';

export const data = new SlashCommandBuilder()
  .setName('raid-debug')
  .setDescription('Fetch a recent raid and post the results embed')
  .addIntegerOption(o => o
    .setName('back')
    .setDescription('How many raid reports back to look (1 = most recent, default 1)')
    .setMinValue(1)
    .setMaxValue(25)
    .setRequired(false));

export async function execute(interaction) {
  if (!isLinked(interaction.user.id)) {
    return interaction.reply({ content: 'Link your Bungie account first with `/link-account`.', ephemeral: true });
  }

  const back = interaction.options.getInteger('back') ?? 1;

  await interaction.deferReply({ ephemeral: true });

  const tokens = getTokens(interaction.user.id);
  const { membershipType, membershipId, displayName } = tokens;
  const characterIds = await getCharacterIds(membershipType, membershipId);

  let activity = null;
  for (const charId of characterIds) {
    const act = await getLatestActivityByMode(membershipType, membershipId, charId, 4, back - 1);
    if (act) { activity = act; break; }
  }

  if (!activity) {
    return interaction.editReply({ content: `No raid activity found ${back} report(s) back.` });
  }

  const pgcr = await getPGCR(activity.activityDetails.instanceId);
  if (!pgcr) {
    return interaction.editReply({ content: 'PGCR not ready yet — try again in a moment.' });
  }

  await postRaidResult(pgcr, { membershipId, displayName, channel: interaction.channel });
  await interaction.editReply({ content: 'Done.' });
}
