import { SlashCommandBuilder } from 'discord.js';
import { getTokens, isLinked } from '../auth/tokenStore.js';
import { getCharacterIds, getLatestActivityByMode, getPGCR } from '../lib/bungieActivity.js';

export const data = new SlashCommandBuilder()
  .setName('raid-debug')
  .setDescription('Fetch your most recent raid PGCR and print it to the terminal');

export async function execute(interaction) {
  if (!isLinked(interaction.user.id)) {
    return interaction.reply({ content: 'Link your Bungie account first with `/link-account`.', ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  const { membershipType, membershipId } = getTokens(interaction.user.id);
  const characterIds = await getCharacterIds(membershipType, membershipId);

  let activity = null;
  let foundChar = null;
  for (const charId of characterIds) {
    const act = await getLatestActivityByMode(membershipType, membershipId, charId, 4);
    if (act) { activity = act; foundChar = charId; break; }
  }

  if (!activity) {
    return interaction.editReply({ content: 'No recent raid activity found.' });
  }

  const instanceId = activity.activityDetails.instanceId;
  console.log(`[RaidDebug] Found raid instanceId=${instanceId} on char=${foundChar}`);

  const pgcr = await getPGCR(instanceId);
  if (!pgcr) {
    return interaction.editReply({ content: `Found instanceId ${instanceId} but PGCR is not ready yet.` });
  }

  console.log('[RaidDebug] activityDetails:', JSON.stringify(pgcr.activityDetails ?? {}));
  for (const e of (pgcr.entries ?? [])) {
    const name  = e.player?.destinyUserInfo?.displayName ?? 'Unknown';
    const stats = Object.entries(e.values ?? {})
      .map(([k, v]) => `${k}=${v?.basic?.displayValue ?? v?.basic?.value}`)
      .join(', ');
    console.log(`[RaidDebug] ${name}: ${stats}`);
  }

  await interaction.editReply({ content: `Done — check the Railway logs for instanceId \`${instanceId}\`.` });
}
