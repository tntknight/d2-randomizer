import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import guidedSession, { MAX_PLAYERS } from './guidedSession.js';
import { shuffle } from './raidData.js';

// ── Button router ─────────────────────────────────────────────────────────────

export async function handleGuidedButton(interaction) {
  const [, action, guildId] = interaction.customId.split(':');
  switch (action) {
    case 'join':     return handleGuidedJoin(interaction, guildId);
    case 'begin':    return handleGuidedBegin(interaction, guildId);
    case 'next-enc': return handleGuidedNextEnc(interaction, guildId);
    case 'finish':   return handleGuidedFinish(interaction, guildId);
    default:
      return interaction.reply({ content: 'Unknown guided action.', ephemeral: true });
  }
}

// ── Embed builders ────────────────────────────────────────────────────────────

export function buildGuidedLobbyEmbed(session) {
  const host = session.players[0]?.username ?? 'Unknown';
  const playerList = session.players.length
    ? session.players.map(p => p.username).join('\n')
    : 'None yet';

  return new EmbedBuilder()
    .setColor(0xc5a93e)
    .setTitle('Guided Raid Lobby')
    .setDescription(`**${session.raid.name}** — up to 6 players can join.`)
    .addFields(
      { name: 'Host',                        value: host,       inline: true },
      { name: `Players (${session.players.length}/6)`, value: playerList, inline: true },
    )
    .setFooter({ text: 'Press Join to enter — host presses Begin when ready' });
}

export function buildGuidedLobbyRow(guildId, joinDisabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`guided:join:${guildId}`)
      .setLabel('Join')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(joinDisabled),
    new ButtonBuilder()
      .setCustomId(`guided:begin:${guildId}`)
      .setLabel('Begin')
      .setStyle(ButtonStyle.Success),
  );
}

export function buildGuidedEncounterEmbed(session) {
  const encounter = session.raid.encounters[session.currentEncounterIndex];
  const total     = session.raid.encounters.length;
  const num       = session.currentEncounterIndex + 1;
  const shuffled  = shuffle(encounter.roles).slice(0, session.players.length);

  const embed = new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle(`Encounter ${num}/${total} — ${encounter.name}`)
    .setDescription(`**${session.raid.name}**`)
    .addFields(
      session.players.map((p, i) => ({
        name:   p.username,
        value:  shuffled[i] ?? 'Support',
        inline: true,
      })),
    )
    .setFooter({ text: 'Roles are randomly assigned each encounter' });

  if (encounter.imageUrl) embed.setImage(encounter.imageUrl);

  return embed;
}

export function buildGuidedEncounterRow(guildId, isLast) {
  const button = isLast
    ? new ButtonBuilder()
        .setCustomId(`guided:finish:${guildId}`)
        .setLabel('Finish Raid')
        .setStyle(ButtonStyle.Danger)
    : new ButtonBuilder()
        .setCustomId(`guided:next-enc:${guildId}`)
        .setLabel('Next Encounter')
        .setStyle(ButtonStyle.Primary);

  return new ActionRowBuilder().addComponents(button);
}

// ── Action handlers ───────────────────────────────────────────────────────────

async function handleGuidedJoin(interaction, guildId) {
  const session = guidedSession.get(guildId);
  if (!session) {
    return interaction.reply({ content: 'This lobby has expired.', ephemeral: true });
  }
  if (session.phase !== 'lobby') {
    return interaction.reply({ content: 'This lobby is no longer open.', ephemeral: true });
  }
  if (session.players.some(p => p.userId === interaction.user.id)) {
    return interaction.reply({ content: "You're already in the lobby!", ephemeral: true });
  }
  if (session.players.length >= MAX_PLAYERS) {
    return interaction.reply({ content: 'The lobby is full (6/6).', ephemeral: true });
  }

  // Synchronous push before any await to avoid race conditions
  session.players.push({
    userId:   interaction.user.id,
    username: interaction.member?.displayName ?? interaction.user.username,
  });
  guidedSession.update(guildId, {});

  const full = session.players.length >= MAX_PLAYERS;
  await interaction.update({
    embeds:     [buildGuidedLobbyEmbed(session)],
    components: [buildGuidedLobbyRow(guildId, full)],
  });
}

async function handleGuidedBegin(interaction, guildId) {
  const session = guidedSession.get(guildId);
  if (!session) {
    return interaction.reply({ content: 'This lobby has expired.', ephemeral: true });
  }
  if (interaction.user.id !== session.hostId) {
    return interaction.reply({ content: 'Only the host can begin the raid.', ephemeral: true });
  }
  if (session.phase !== 'lobby') {
    return interaction.reply({ content: 'The lobby has already started.', ephemeral: true });
  }
  if (session.players.length < 2) {
    return interaction.reply({ content: 'Need at least 2 players to begin.', ephemeral: true });
  }

  guidedSession.update(guildId, { phase: 'encounter', currentEncounterIndex: 0 });
  const isLast = session.raid.encounters.length === 1;

  await interaction.update({
    embeds:     [buildGuidedEncounterEmbed(session)],
    components: [buildGuidedEncounterRow(guildId, isLast)],
  });
}

async function handleGuidedNextEnc(interaction, guildId) {
  const session = guidedSession.get(guildId);
  if (!session) {
    return interaction.reply({ content: 'No active guided raid session.', ephemeral: true });
  }
  if (session.phase !== 'encounter') {
    return interaction.reply({ content: 'No active encounter.', ephemeral: true });
  }
  if (interaction.user.id !== session.hostId) {
    return interaction.reply({ content: 'Only the host can advance encounters.', ephemeral: true });
  }

  const nextIndex = session.currentEncounterIndex + 1;
  if (nextIndex >= session.raid.encounters.length) {
    return handleGuidedFinish(interaction, guildId);
  }

  guidedSession.update(guildId, { currentEncounterIndex: nextIndex });
  const isLast = nextIndex === session.raid.encounters.length - 1;

  await interaction.update({
    embeds:     [buildGuidedEncounterEmbed(session)],
    components: [buildGuidedEncounterRow(guildId, isLast)],
  });
}

async function handleGuidedFinish(interaction, guildId) {
  const session = guidedSession.get(guildId);
  if (!session) {
    return interaction.reply({ content: 'No active guided raid session.', ephemeral: true });
  }
  if (session.phase !== 'encounter') {
    return interaction.reply({ content: 'No active encounter.', ephemeral: true });
  }
  if (interaction.user.id !== session.hostId) {
    return interaction.reply({ content: 'Only the host can finish the raid.', ephemeral: true });
  }

  const raidName = session.raid.name;
  guidedSession.clear(guildId);

  const doneEmbed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle('Raid Complete!')
    .setDescription(`**${raidName}** — well done, Guardians! Run \`/raid-start\` for another guided raid.`);

  await interaction.update({ embeds: [doneEmbed], components: [] });
}
