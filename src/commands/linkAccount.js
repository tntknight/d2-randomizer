import { SlashCommandBuilder } from 'discord.js';
import { buildAuthUrl } from '../auth/bungieOAuth.js';
import { addPendingLink } from '../server/callbackServer.js';
import { isLinked, getTokens } from '../auth/tokenStore.js';

export const data = new SlashCommandBuilder()
  .setName('link-account')
  .setDescription('Link your Bungie account so the bot can fetch your vault automatically');

export async function execute(interaction) {
  const userId        = interaction.user.id;
  const alreadyLinked = isLinked(userId);
  const currentName   = alreadyLinked ? getTokens(userId).displayName : null;

  const state = addPendingLink(userId);
  const url   = buildAuthUrl(state);

  const lines = alreadyLinked
    ? [
        `✅ **You are already linked as: ${currentName}**`,
        '',
        'You don\'t need to do anything — your account is active.',
        'Run `/load-vault` to sync your weapons or `/random-exotic` to use your linked account.',
        '',
        '─────────────────────────────',
        '*Want to switch to a different Bungie account?*',
        `**[Click here to re-link](${url})** — this will replace **${currentName}**`,
        '*Link expires in 10 minutes.*',
      ]
    : [
        '### Link Your Bungie Account',
        '1. Click the link below and sign in with Bungie',
        '2. Approve access for the D2 Randomizer bot',
        '3. Come back to Discord and run `/load-vault` to fetch your weapons',
        '',
        `**[Click here to link your account](${url})**`,
        '',
        '*This link expires in 10 minutes.*',
        '*If anything goes wrong, just run `/link-account` again for a fresh link.*',
      ];

  await interaction.reply({ content: lines.join('\n'), ephemeral: true });
}
