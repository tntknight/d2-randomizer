import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import chaosSession from './chaosSession.js';
import { pickRandomRaid, shuffle } from './raidData.js';

const CLASSES = ['Titan', 'Hunter', 'Warlock'];
const CLASS_COLORS = { Titan: 0xe8a838, Hunter: 0x4a9eff, Warlock: 0x9b59b6 };

export async function handleChaosButton(interaction) {
  const parts = interaction.customId.split(':');
  const action = parts[1];
  const guildId = parts[2];

  switch (action) {
    case 'join':        return handleJoin(interaction, guildId);
    case 'begin':       return handleBegin(interaction, guildId);
    case 'class-yes':   return handleClassChoice(interaction, guildId, true);
    case 'class-no':    return handleClassChoice(interaction, guildId, false);
    case 'keep-raid':   return handleKeepRaid(interaction, guildId);
    case 'reroll-raid': return handleRerollRaid(interaction, guildId);
    case 'next-enc':    return handleNextEnc(interaction, guildId);
    case 'reroll-roles':return handleRerollRoles(interaction, guildId);
    case 'quickroll':   return handleQuickRoll(interaction, guildId);
    default:
      await interaction.reply({ content: 'Unknown chaos action.', ephemeral: true });
  }
}

// ── Shared embed builders ────────────────────────────────────────────────────

export function buildLobbyEmbed(session) {
  const hostName   = session.players.find(p => p.userId === session.hostId)?.username ?? 'Unknown';
  const playerList = session.players.map(p => p.username).join('\n') || 'None yet';
  return new EmbedBuilder()
    .setColor(0xc5a93e)
    .setTitle('Chaos Raid Lobby')
    .setDescription('A Chaos Raid is forming! Up to 6 players can join.')
    .addFields(
      { name: 'Host', value: hostName, inline: true },
      { name: `Players (${session.players.length}/6)`, value: playerList, inline: true },
    )
    .setFooter({ text: 'Press Join to enter — host presses Begin when ready' });
}

export function buildLobbyRow(guildId, disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`chaos:join:${guildId}`)
      .setLabel('Join')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(`chaos:begin:${guildId}`)
      .setLabel('Begin')
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled),
  );
}

export function buildClassOptInEmbed(session) {
  const fields = session.players.map(p => ({
    name: p.username,
    value: p.wantsRandomClass === null ? 'Pending…'
         : p.wantsRandomClass ? 'Yes ✅'
         : 'No ❌',
    inline: true,
  }));
  return new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle('Class Assignment Opt-In')
    .setDescription('Do you want a randomly assigned class for this raid?')
    .addFields(...fields)
    .setFooter({ text: 'Everyone must respond before the raid begins' });
}

export function buildClassOptInRow(guildId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`chaos:class-yes:${guildId}`)
      .setLabel('Yes, assign me a class')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`chaos:class-no:${guildId}`)
      .setLabel("No, I'll pick my own")
      .setStyle(ButtonStyle.Secondary),
  );
}

export function buildRaidRollEmbed(session) {
  const classLines = session.players.map(p => {
    const cls = p.assignedClass ? ` — ${p.assignedClass}` : '';
    return `${p.username}${cls}`;
  }).join('\n');

  const rerollsLeft = chaosSession.MAX_REROLLS - session.rerollsUsed;
  return new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle('Chaos Raid Roll')
    .setDescription(`Your raid is: **${session.raid.name}**`)
    .addFields({ name: 'Players', value: classLines })
    .setFooter({ text: `Rerolls remaining: ${rerollsLeft}/${chaosSession.MAX_REROLLS}` });
}

export function buildRaidRollRow(guildId, rerollsUsed) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`chaos:keep-raid:${guildId}`)
      .setLabel('Keep this Raid')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`chaos:reroll-raid:${guildId}`)
      .setLabel('Reroll')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(rerollsUsed >= chaosSession.MAX_REROLLS),
  );
}

export function buildEncounterEmbed(session) {
  const encounter = session.raid.encounters[session.currentEncounterIndex];
  const total     = session.raid.encounters.length;
  const num       = session.currentEncounterIndex + 1;

  const shuffledRoles = shuffle(encounter.roles).slice(0, session.players.length);
  const roleFields = session.players.map((p, i) => ({
    name: p.username,
    value: shuffledRoles[i] ?? 'Support',
    inline: true,
  }));

  return {
    embed: new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle(`Encounter ${num}/${total} — ${encounter.name}`)
      .setDescription(`**${session.raid.name}**`)
      .addFields(...roleFields)
      .setFooter({ text: 'Roles are randomly assigned each encounter' }),
    roles: shuffledRoles,
  };
}

export function buildEncounterRow(guildId, isLast) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`chaos:next-enc:${guildId}`)
      .setLabel(isLast ? 'Finish Raid' : 'Next Encounter')
      .setStyle(isLast ? ButtonStyle.Danger : ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`chaos:reroll-roles:${guildId}`)
      .setLabel('Reroll Roles')
      .setStyle(ButtonStyle.Secondary),
  );
}

// ── Handlers ─────────────────────────────────────────────────────────────────

async function handleJoin(interaction, guildId) {
  const session = chaosSession.get(guildId);
  if (!session) return interaction.reply({ content: 'This lobby has expired.', ephemeral: true });
  if (session.phase !== 'lobby') return interaction.reply({ content: 'This lobby is no longer open.', ephemeral: true });
  if (session.players.some(p => p.userId === interaction.user.id)) {
    return interaction.reply({ content: "You're already in the lobby!", ephemeral: true });
  }
  if (session.players.length >= 6) {
    return interaction.reply({ content: 'The lobby is full (6/6).', ephemeral: true });
  }

  // Synchronous push before any await to prevent race conditions
  session.players.push({ userId: interaction.user.id, username: interaction.member?.displayName ?? interaction.user.username, wantsRandomClass: null, assignedClass: null });
  chaosSession.update(guildId, {});

  const full = session.players.length >= 6;
  await interaction.update({
    embeds: [buildLobbyEmbed(session)],
    components: [buildLobbyRow(guildId, full)],
  });
}

async function handleBegin(interaction, guildId) {
  const session = chaosSession.get(guildId);
  if (!session) return interaction.reply({ content: 'No active lobby found.', ephemeral: true });
  if (session.hostId !== interaction.user.id) {
    return interaction.reply({ content: 'Only the host can begin the raid.', ephemeral: true });
  }
  if (session.phase !== 'lobby') {
    return interaction.reply({ content: 'The lobby has already been started.', ephemeral: true });
  }
  if (session.players.length < 2) {
    return interaction.reply({ content: 'Need at least 2 players to begin.', ephemeral: true });
  }

  chaosSession.update(guildId, { phase: 'class-opt-in', classOptInPending: session.players.length });

  await interaction.update({
    embeds: [buildClassOptInEmbed(session)],
    components: [buildClassOptInRow(guildId)],
  });
}

async function handleClassChoice(interaction, guildId, wantsClass) {
  const session = chaosSession.get(guildId);
  if (!session) return interaction.reply({ content: 'No active session found.', ephemeral: true });
  if (session.phase !== 'class-opt-in') {
    return interaction.reply({ content: 'Class selection is not active.', ephemeral: true });
  }

  const player = session.players.find(p => p.userId === interaction.user.id);
  if (!player) return interaction.reply({ content: "You're not in this session.", ephemeral: true });
  if (player.wantsRandomClass !== null) {
    return interaction.reply({ content: 'You already responded!', ephemeral: true });
  }

  // Synchronous update before any await
  player.wantsRandomClass = wantsClass;
  session.classOptInPending--;
  chaosSession.update(guildId, {});

  if (session.classOptInPending > 0) {
    return interaction.update({
      embeds: [buildClassOptInEmbed(session)],
      components: [buildClassOptInRow(guildId)],
    });
  }

  // All players have responded — assign classes to opted-in players
  const optedIn = session.players.filter(p => p.wantsRandomClass);
  if (optedIn.length > 0) {
    const classPool = [];
    while (classPool.length < optedIn.length) {
      classPool.push(...shuffle(CLASSES));
    }
    optedIn.forEach((p, i) => { p.assignedClass = classPool[i]; });
  }

  // Roll a raid and advance phase
  const raid = pickRandomRaid();
  chaosSession.update(guildId, { phase: 'raid-roll', raid });

  await interaction.update({
    embeds: [buildRaidRollEmbed(session)],
    components: [buildRaidRollRow(guildId, 0)],
  });
}

async function handleKeepRaid(interaction, guildId) {
  const session = chaosSession.get(guildId);
  if (!session) return interaction.reply({ content: 'No active session found.', ephemeral: true });
  if (session.hostId !== interaction.user.id) {
    return interaction.reply({ content: 'Only the host can lock in the raid.', ephemeral: true });
  }
  if (session.phase !== 'raid-roll') {
    return interaction.reply({ content: 'No raid roll is active.', ephemeral: true });
  }

  chaosSession.update(guildId, { phase: 'encounter', currentEncounterIndex: 0 });

  const isLast = session.raid.encounters.length === 1;
  const { embed } = buildEncounterEmbed(session);
  await interaction.update({ embeds: [embed], components: [buildEncounterRow(guildId, isLast)] });
}

async function handleRerollRaid(interaction, guildId) {
  const session = chaosSession.get(guildId);
  if (!session) return interaction.reply({ content: 'No active session found.', ephemeral: true });
  if (session.hostId !== interaction.user.id) {
    return interaction.reply({ content: 'Only the host can reroll the raid.', ephemeral: true });
  }
  if (session.phase !== 'raid-roll') {
    return interaction.reply({ content: 'No raid roll is active.', ephemeral: true });
  }
  if (session.rerollsUsed >= chaosSession.MAX_REROLLS) {
    return interaction.reply({ content: 'Maximum rerolls reached.', ephemeral: true });
  }

  const newRaid = pickRandomRaid(session.raid.id);
  chaosSession.update(guildId, { raid: newRaid, rerollsUsed: session.rerollsUsed + 1 });

  await interaction.update({
    embeds: [buildRaidRollEmbed(session)],
    components: [buildRaidRollRow(guildId, session.rerollsUsed)],
  });
}

async function handleNextEnc(interaction, guildId) {
  const session = chaosSession.get(guildId);
  if (!session) return interaction.reply({ content: 'No active session found.', ephemeral: true });
  if (session.phase !== 'encounter') {
    return interaction.reply({ content: 'No active raid encounter.', ephemeral: true });
  }
  if (!session.players.some(p => p.userId === interaction.user.id)) {
    return interaction.reply({ content: "You're not in this session.", ephemeral: true });
  }

  const nextIndex = session.currentEncounterIndex + 1;

  if (nextIndex >= session.raid.encounters.length) {
    chaosSession.clear(guildId);
    const doneEmbed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle('Raid Complete!')
      .setDescription('Good luck, Guardians! Run `/chaos-start` for another chaos raid.');
    return interaction.update({ embeds: [doneEmbed], components: [] });
  }

  chaosSession.update(guildId, { currentEncounterIndex: nextIndex });

  const isLast = nextIndex === session.raid.encounters.length - 1;
  const { embed } = buildEncounterEmbed(session);
  await interaction.update({ embeds: [embed], components: [buildEncounterRow(guildId, isLast)] });
}

async function handleRerollRoles(interaction, guildId) {
  const session = chaosSession.get(guildId);
  if (!session) return interaction.reply({ content: 'No active session found.', ephemeral: true });
  if (session.phase !== 'encounter') {
    return interaction.reply({ content: 'No active raid encounter.', ephemeral: true });
  }
  if (!session.players.some(p => p.userId === interaction.user.id)) {
    return interaction.reply({ content: "You're not in this session.", ephemeral: true });
  }

  chaosSession.update(guildId, {});

  const isLast = session.currentEncounterIndex === session.raid.encounters.length - 1;
  const { embed } = buildEncounterEmbed(session);
  await interaction.update({ embeds: [embed], components: [buildEncounterRow(guildId, isLast)] });
}

async function handleQuickRoll(interaction, guildId) {
  const raid = pickRandomRaid();
  const embed = new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle('Random Raid')
    .setDescription(`**${raid.name}**`)
    .addFields({ name: 'Encounters', value: raid.encounters.map((e, i) => `${i + 1}. ${e.name}`).join('\n') })
    .setFooter({ text: 'Use /chaos-start to run a full chaos session' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`chaos:quickroll:${guildId}`)
      .setLabel('Roll Again')
      .setStyle(ButtonStyle.Primary),
  );

  await interaction.update({ embeds: [embed], components: [row] });
}
