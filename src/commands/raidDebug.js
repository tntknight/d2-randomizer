import { SlashCommandBuilder } from 'discord.js';
import { getTokens, isLinked } from '../auth/tokenStore.js';
import { getCharacterIds, getLatestActivityByMode, getPGCR } from '../lib/bungieActivity.js';
import { postRaidResult } from '../lib/raidWatcher.js';

export const data = new SlashCommandBuilder()
  .setName('raid-debug')
  .setDescription('Fetch your most recent raid and post the results embed');

export async function execute(interaction) {
  if (!isLinked(interaction.user.id)) {
    return interaction.reply({ content: 'Link your Bungie account first with `/link-account`.', ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  const tokens = getTokens(interaction.user.id);
  const { membershipType, membershipId, displayName } = tokens;
  const characterIds = await getCharacterIds(membershipType, membershipId);

  let activity = null;
  for (const charId of characterIds) {
    const act = await getLatestActivityByMode(membershipType, membershipId, charId, 4);
    if (act) { activity = act; break; }
  }

  if (!activity) {
    return interaction.editReply({ content: 'No recent raid activity found.' });
  }

  const pgcr = await getPGCR(activity.activityDetails.instanceId);
  if (!pgcr) {
    return interaction.editReply({ content: 'PGCR not ready yet — try again in a moment.' });
  }

  await postRaidResult(pgcr, { membershipId, displayName, channel: interaction.channel });
  await interaction.editReply({ content: 'Done.' });
}
