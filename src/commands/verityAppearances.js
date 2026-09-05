import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { fetchEquippedAppearance, fetchPartyMembers } from '../lib/bungieEquipped.js';
import { isLinked, findDiscordUserByMembershipId } from '../auth/tokenStore.js';
import { buildPlayerGridImage } from '../lib/armorImage.js';

export const data = new SlashCommandBuilder()
  .setName('verity-appearances')
  .setDescription("Show each player's equipped ghost and armor for Verity statue identification")
  .addUserOption(o => o.setName('player1').setDescription('Add a player not auto-detected from your fireteam').setRequired(false))
  .addUserOption(o => o.setName('player2').setDescription('Add a player not auto-detected from your fireteam').setRequired(false))
  .addUserOption(o => o.setName('player3').setDescription('Add a player not auto-detected from your fireteam').setRequired(false))
  .addUserOption(o => o.setName('player4').setDescription('Add a player not auto-detected from your fireteam').setRequired(false))
  .addUserOption(o => o.setName('player5').setDescription('Add a player not auto-detected from your fireteam').setRequired(false))
  .addUserOption(o => o.setName('player6').setDescription('Add a player not auto-detected from your fireteam').setRequired(false));

export async function execute(interaction) {
  await interaction.deferReply();

  try {
    // Auto-detect the invoker's live fireteam via Bungie's Transitory profile
    // component. Bungie flags this data as best-effort/non-authoritative, so
    // it's a starting point — the player1-6 options can add anyone it misses.
    const seen = new Set([interaction.user.id]);
    const targets = [{ discordUserId: interaction.user.id, user: interaction.user }];

    if (isLinked(interaction.user.id)) {
      try {
        const partyMembers = await fetchPartyMembers(interaction.user.id);
        for (const member of partyMembers) {
          const discordUserId = findDiscordUserByMembershipId(String(member.membershipId));
          if (discordUserId && !seen.has(discordUserId)) {
            seen.add(discordUserId);
            const user = await interaction.client.users.fetch(discordUserId).catch(() => null);
            targets.push({ discordUserId, user, fallbackName: member.displayName });
          } else if (!discordUserId) {
            targets.push({ discordUserId: null, user: null, fallbackName: member.displayName });
          }
        }
      } catch (err) {
        console.warn('[verity-appearances] fireteam auto-detect failed:', err.message);
      }
    }

    const manualUsers = ['player1', 'player2', 'player3', 'player4', 'player5', 'player6']
      .map(k => interaction.options.getUser(k))
      .filter(Boolean);
    for (const user of manualUsers) {
      if (seen.has(user.id)) continue;
      seen.add(user.id);
      targets.push({ discordUserId: user.id, user });
    }

    const results = await Promise.all(targets.map(async (target) => {
      const rawName = target.user
        ? (interaction.guild
            ? (await interaction.guild.members.fetch(target.user.id).catch(() => null))?.displayName ?? target.user.username
            : target.user.username)
        : target.fallbackName ?? 'Unknown';
      const displayName = rawName.split('#')[0];

      if (!target.discordUserId) {
        return {
          name: displayName,
          items: null,
          error: 'Detected in your fireteam but hasn\'t linked a Discord account — run `/link-account` to connect.',
        };
      }

      try {
        const a = await fetchEquippedAppearance(target.discordUserId);
        const items = [a.ghost, a.helmet, a.gauntlets, a.chest, a.legs, a.classItem];
        return { name: displayName, items, error: null };
      } catch (err) {
        console.error(`[verity-appearances] fetch failed for ${target.discordUserId}:`, err);
        return {
          name: displayName,
          items: null,
          error: err.message === 'no-link'
            ? 'Bungie account not linked — run `/link-account` to connect.'
            : 'Could not fetch appearance data.',
        };
      }
    }));

    const players = results.filter(r => r.items);
    const failed = results.filter(r => !r.items);

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle('Verity Appearances')
      .setDescription(
        'Rows top to bottom: Ghost, Helmet, Arms, Chest, Legs, Class Item'
        + (failed.length ? `\n\n${failed.map(f => `⚠️ **${f.name}** — ${f.error}`).join('\n')}` : '')
      );

    const files = [];
    if (players.length > 0) {
      const imageBuffer = await buildPlayerGridImage(players);
      if (imageBuffer) {
        const filename = 'verity-appearances.png';
        files.push(new AttachmentBuilder(imageBuffer, { name: filename }));
        embed.setImage(`attachment://${filename}`);
      }
    }

    await interaction.editReply({ embeds: [embed], files });
  } catch (err) {
    console.error('[verity-appearances] Error:', err);
    await interaction.editReply({ content: 'Failed to fetch appearance data. Try again in a moment.' });
  }
}
