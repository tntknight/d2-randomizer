import { SlashCommandBuilder } from 'discord.js';
import guidedSession from '../lib/guidedSession.js';
import { buildGuidedLobbyEmbed, buildGuidedLobbyRow } from '../lib/guidedButtonHandler.js';
import { isLinked } from '../auth/tokenStore.js';
import { startRaidWatching, isRaidWatching } from '../lib/raidWatcher.js';

export const data = new SlashCommandBuilder()
  .setName('raid-start')
  .setDescription('Open a guided Raid lobby with role assignments and encounter images')
  .addStringOption(o =>
    o.setName('raid')
      .setDescription('Which raid to run')
      .setRequired(true)
      .addChoices(
        { name: 'Last Wish',           value: 'last-wish' },
        { name: 'Garden of Salvation', value: 'garden-of-salvation' },
        { name: 'Deep Stone Crypt',    value: 'deep-stone-crypt' },
        { name: 'Vault of Glass',      value: 'vault-of-glass' },
        { name: 'Vow of the Disciple', value: 'vow-of-the-disciple' },
        { name: "King's Fall",         value: 'kings-fall' },
        { name: 'Root of Nightmares',  value: 'root-of-nightmares' },
        { name: "Crota's End",         value: 'crotas-end' },
        { name: "Salvation's Edge",    value: 'salvations-edge' },
      )
  );

export async function execute(interaction) {
  const guildId = interaction.guildId;
  const raidId  = interaction.options.getString('raid');

  const existing = guidedSession.get(guildId);
  if (existing) {
    return interaction.reply({
      content: `A guided raid is already active (phase: **${existing.phase}**). Finish it first.`,
      ephemeral: true,
    });
  }

  const session = guidedSession.create(guildId, interaction.user.id, interaction.channelId, raidId);
  session.players.push({
    userId:   interaction.user.id,
    username: interaction.member?.displayName ?? interaction.user.username,
  });

  const msg = await interaction.reply({
    embeds:     [buildGuidedLobbyEmbed(session)],
    components: [buildGuidedLobbyRow(guildId)],
    fetchReply: true,
  });
  guidedSession.update(guildId, { lobbyMessageId: msg.id });

  // Start raid watcher for the host — best-effort, never blocks the lobby
  if (isLinked(interaction.user.id) && !isRaidWatching(interaction.user.id)) {
    startRaidWatching(interaction.user.id, interaction.channel)
      .catch(err => console.warn('[raid-start] Watcher start failed:', err.message));
  }
}
